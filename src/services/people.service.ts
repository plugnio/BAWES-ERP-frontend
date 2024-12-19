import { BaseService } from './base.service';
import type { CreatePersonDto, UpdatePersonDto } from '@bawes/erp-api-sdk';
import type { AxiosPromise } from 'axios';

interface Person {
  id: string;
  nameEn: string;
  nameAr: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
}

export class PeopleService extends BaseService {
  async create(createPersonDto: CreatePersonDto): Promise<Person> {
    return this.handleRequest<Person>(
      this.client.people.personControllerCreate(createPersonDto) as unknown as AxiosPromise<Person>
    );
  }

  async findAll(): Promise<Person[]> {
    return this.handleRequest<Person[]>(
      this.client.people.personControllerFindAll() as unknown as AxiosPromise<Person[]>
    );
  }

  async findOne(id: string): Promise<Person> {
    return this.handleRequest<Person>(
      this.client.people.personControllerFindOne(id) as unknown as AxiosPromise<Person>
    );
  }

  async update(id: string, updatePersonDto: UpdatePersonDto): Promise<Person> {
    return this.handleRequest<Person>(
      this.client.people.personControllerUpdate(id, updatePersonDto) as unknown as AxiosPromise<Person>
    );
  }

  async remove(id: string): Promise<void> {
    await this.handleRequest<void>(
      this.client.people.personControllerRemove(id) as unknown as AxiosPromise<void>
    );
  }
} 