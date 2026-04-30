import {
  addShowTaskAction,
  deleteShowTaskAction,
  moveShowTaskAction,
  toggleShowTaskAction,
} from "./tasks-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type TaskRow = {
  id: string;
  label: string;
  done: boolean;
  doneAt: Date | null;
  doneByUserId: string | null;
};

export function ShowTasksCard({
  showId,
  tasks,
  canEdit,
  currentUserId,
}: {
  showId: string;
  tasks: TaskRow[];
  canEdit: boolean;
  currentUserId: string;
}) {
  const completed = tasks.filter((t) => t.done).length;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {completed}/{tasks.length} done
        </span>
      </div>

      {tasks.length === 0 && !canEdit && (
        <p className="text-sm text-muted-foreground">No tasks yet.</p>
      )}

      {tasks.length > 0 && (
        <ul className="divide-y divide-border">
          {tasks.map((t, i) => (
            <li
              key={t.id}
              className="flex items-center gap-2 py-2 text-sm"
            >
              <form action={toggleShowTaskAction} className="flex shrink-0">
                <input type="hidden" name="id" value={t.id} />
                <input type="hidden" name="showId" value={showId} />
                <input type="hidden" name="done" value={t.done ? "false" : "true"} />
                <button
                  type="submit"
                  disabled={!canEdit}
                  aria-label={t.done ? "Mark incomplete" : "Mark complete"}
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    t.done
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-border hover:border-foreground"
                  } ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {t.done && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </form>

              <span
                className={`min-w-0 flex-1 ${
                  t.done ? "text-muted-foreground line-through" : ""
                }`}
              >
                {t.label}
                {t.done && t.doneByUserId === currentUserId && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (you)
                  </span>
                )}
              </span>

              {canEdit && (
                <div className="flex shrink-0 items-center gap-1">
                  {i > 0 && (
                    <form action={moveShowTaskAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="showId" value={showId} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        aria-label="Move up"
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        ↑
                      </button>
                    </form>
                  )}
                  {i < tasks.length - 1 && (
                    <form action={moveShowTaskAction}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="showId" value={showId} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        aria-label="Move down"
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        ↓
                      </button>
                    </form>
                  )}
                  <form action={deleteShowTaskAction}>
                    <input type="hidden" name="id" value={t.id} />
                    <input type="hidden" name="showId" value={showId} />
                    <button
                      type="submit"
                      aria-label="Delete task"
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      ×
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <form action={addShowTaskAction} className="flex gap-2">
          <input type="hidden" name="showId" value={showId} />
          <Input
            name="label"
            placeholder="Add a task…"
            maxLength={200}
            required
            className="flex-1"
          />
          <Button type="submit" size="sm">
            Add
          </Button>
        </form>
      )}
    </div>
  );
}
