import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTodoListDto } from './dtos/create-todo_list';
import { UpdateTodoListDto } from './dtos/update-todo_list';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoList } from './todo_list.entity';
import { Todo } from '../todos/todo.entity';

@Injectable()
export class TodoListsService {
  constructor(
    @InjectRepository(TodoList)
    private readonly todoListRepository: Repository<TodoList>,
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  async all(): Promise<TodoList[]> {
    const todoLists = await this.todoListRepository.find({
      relations: ['todos'],
    });
    return todoLists.map((todoList) => ({
      ...todoList,
      todos: todoList.todos || [],
    }));
  }

  async get(id: number): Promise<TodoList> {
    const todoList = await this.todoListRepository.findOne({
      where: { id },
      relations: ['todos'],
    });

    if (!todoList) {
      throw new NotFoundException(`TodoList with id ${id} not found`);
    }

    return {
      ...todoList,
      todos: todoList.todos || [],
    };
  }

  async create(dto: CreateTodoListDto): Promise<TodoList> {
    const todoList = this.todoListRepository.create({ name: dto.name });
    return await this.todoListRepository.save(todoList);
  }

  async update(id: number, dto: UpdateTodoListDto): Promise<TodoList> {
    return await this.todoListRepository.save({ id, ...dto } as TodoList);
  }

  async delete(id: number): Promise<void> {
    await this.todoListRepository.delete(id);
  }

  async completeAll(id: number): Promise<TodoList> {
    const todoList = await this.todoListRepository.findOneBy({ id });

    if (!todoList) {
      throw new NotFoundException(`TodoList with id ${id} not found`);
    }

    await this.todoRepository
      .createQueryBuilder()
      .update(Todo)
      .set({ completed: true })
      .where('todo_list_id = :id', { id })
      .execute();

    return await this.get(id);
  }
}
