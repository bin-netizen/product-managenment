// server/src/tasks/tasks.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException } from '@nestjs/common';

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

const tasks: Task[] = [];

@Controller('tasks')
export class TasksController {
  @Get()
  getAll() {
    return tasks;
  }

  @Get(':id')
  getOne(@Param('id') id: number) {
    const task = tasks.find(t => t.id === +id);
    if (!task) throw new NotFoundException();
    return task;
  }

  @Post()
  create(@Body() task: Task) {
    tasks.push(task);
    return task;
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() updated: Task) {
    const index = tasks.findIndex(t => t.id === +id);
    if (index === -1) throw new NotFoundException();
    tasks[index] = updated;
    return updated;
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    const index = tasks.findIndex(t => t.id === +id);
    if (index === -1) throw new NotFoundException();
    tasks.splice(index, 1);
    return { deleted: true };
  }
}
