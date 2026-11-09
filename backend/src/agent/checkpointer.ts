import {
  BaseCheckpointSaver,
  Checkpoint,
  CheckpointListOptions,
  CheckpointMetadata,
  CheckpointTuple,
  PendingWrite,
} from "@langchain/langgraph-checkpoint";
import { RunnableConfig } from "@langchain/core/runnables";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.js";

export class PostgresWorkflowCheckpointer extends BaseCheckpointSaver {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    super();
    this.supabase = supabase;
  }

  async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns ?? "";
    const checkpointId = config.configurable?.checkpoint_id;

    if (!threadId) return undefined;

    let query = this.supabase
      .from("checkpoints")
      .select("*")
      .eq("thread_id", threadId)
      .eq("checkpoint_ns", checkpointNs);

    if (checkpointId) {
      query = query.eq("checkpoint_id", checkpointId);
    } else {
      query = query.order("checkpoint_id", { ascending: false }).limit(1);
    }

    const { data: rows, error } = await query;
    if (error || !rows || rows.length === 0) return undefined;

    const row = rows[0];

    const { data: writesData } = await this.supabase
      .from("checkpoint_writes")
      .select("*")
      .eq("thread_id", threadId)
      .eq("checkpoint_ns", checkpointNs)
      .eq("checkpoint_id", row.checkpoint_id);

    const pendingWrites: PendingWrite[] = (writesData || []).map((w: any) => [
      w.task_id,
      w.channel,
      w.blob ? JSON.parse(Buffer.from(w.blob, "base64").toString("utf8")) : undefined,
    ]);

    return {
      config: {
        configurable: {
          thread_id: row.thread_id,
          checkpoint_ns: row.checkpoint_ns,
          checkpoint_id: row.checkpoint_id,
        },
      },
      checkpoint: row.checkpoint as unknown as Checkpoint,
      metadata: (row.metadata as unknown as CheckpointMetadata) || {},
      parentConfig: row.parent_checkpoint_id
        ? {
            configurable: {
              thread_id: row.thread_id,
              checkpoint_ns: row.checkpoint_ns,
              checkpoint_id: row.parent_checkpoint_id,
            },
          }
        : undefined,
      pendingWrites,
    };
  }

  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions
  ): AsyncGenerator<CheckpointTuple> {
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns ?? "";

    if (!threadId) return;

    let query = this.supabase
      .from("checkpoints")
      .select("*")
      .eq("thread_id", threadId)
      .eq("checkpoint_ns", checkpointNs)
      .order("checkpoint_id", { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.before?.configurable?.checkpoint_id) {
      query = query.lt("checkpoint_id", options.before.configurable.checkpoint_id);
    }

    const { data: rows, error } = await query;
    if (error || !rows) return;

    for (const row of rows) {
      yield {
        config: {
          configurable: {
            thread_id: row.thread_id,
            checkpoint_ns: row.checkpoint_ns,
            checkpoint_id: row.checkpoint_id,
          },
        },
        checkpoint: row.checkpoint as unknown as Checkpoint,
        metadata: (row.metadata as unknown as CheckpointMetadata) || {},
        parentConfig: row.parent_checkpoint_id
          ? {
              configurable: {
                thread_id: row.thread_id,
                checkpoint_ns: row.checkpoint_ns,
                checkpoint_id: row.parent_checkpoint_id,
              },
            }
          : undefined,
      };
    }
  }

  async put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    _newVersions: Record<string, string | number>
  ): Promise<RunnableConfig> {
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns ?? "";
    const parentCheckpointId = config.configurable?.checkpoint_id;

    if (!threadId) throw new Error("Missing thread_id in runnable config");

    const serializedCheckpoint = JSON.parse(JSON.stringify(checkpoint));
    const serializedMetadata = JSON.parse(JSON.stringify(metadata));

    const { error } = await this.supabase.from("checkpoints").upsert({
      thread_id: threadId,
      checkpoint_ns: checkpointNs,
      checkpoint_id: checkpoint.id,
      parent_checkpoint_id: parentCheckpointId ?? null,
      type: "application/json",
      checkpoint: serializedCheckpoint,
      metadata: serializedMetadata,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to save checkpoint: ${error.message}`);
    }

    return {
      configurable: {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpoint.id,
      },
    };
  }

  async putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string
  ): Promise<void> {
    const threadId = config.configurable?.thread_id;
    const checkpointNs = config.configurable?.checkpoint_ns ?? "";
    const checkpointId = config.configurable?.checkpoint_id;

    if (!threadId || !checkpointId) return;

    const rows = writes.map((write, idx) => {
      const [channel, value] = write;
      const buffer = Buffer.from(JSON.stringify(value)).toString("base64");
      return {
        thread_id: threadId,
        checkpoint_ns: checkpointNs,
        checkpoint_id: checkpointId,
        task_id: taskId,
        idx,
        channel,
        type: "application/json",
        blob: buffer as any,
      };
    });

    if (rows.length > 0) {
      await this.supabase.from("checkpoint_writes").upsert(rows);
    }
  }
}

