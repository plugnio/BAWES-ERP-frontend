import { BaseService } from './base.service';
import type { CreatePersonDto, UpdatePersonDto } from '@bawes/erp-api-sdk';

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
      this.client.people.personControllerCreate(createPersonDto)
    );
  }

  async findAll(): Promise<Person[]> {
    return this.handleRequest<Person[]>(
      this.client.people.personControllerFindAll()
    );
  }

  async findOne(id: string): Promise<Person> {
    return this.handleRequest<Person>(
      this.client.people.personControllerFindOne(id)
    );
  }

  async update(id: string, updatePersonDto: UpdatePersonDto): Promise<Person> {
    return this.handleRequest<Person>(
      this.client.people.personControllerUpdate(id, updatePersonDto)
    );
  }

  async remove(id: string): Promise<void> {
    await this.handleRequest<void>(
      this.client.people.personControllerRemove(id)
    );
  }
} 