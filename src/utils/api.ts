// src/utils/api.ts
export async function fetchTasks() {
  const res = await fetch("http://localhost:3000/tasks");
  return res.json();
}

export async function fetchTask(id: number) {
  const res = await fetch(`http://localhost:3000/tasks/${id}`);
  return res.json();
}

export async function createTask(task: { id: number; title: string; completed: boolean }) {
  const res = await fetch("http://localhost:3000/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  return res.json();
}
