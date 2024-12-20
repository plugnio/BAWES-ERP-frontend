import { BaseService } from './base.service';
import type { CreatePersonDto, UpdatePersonDto } from '@bawes/erp-api-sdk';
import type { AxiosPromise } from 'axios';

/**
 * Represents a person in the system
 * @interface Person
 */
interface Person {
  /** Unique identifier for the person */
  id: string;
  /** Person's name in English */
  nameEn: string;
  /** Person's name in Arabic */
  nameAr: string;
  /** Current status of the person's account */
  accountStatus: string;
  /** Timestamp when the person was created */
  createdAt: string;
  /** Timestamp when the person was last updated */
  updatedAt: string;
}

/**
 * Service for managing people in the system
 * Provides CRUD operations for person records
 * 
 * @extends BaseService
 * 
 * @example
 * ```typescript
 * const peopleService = new PeopleService();
 * 
 * // Create a new person
 * const person = await peopleService.create({
 *   nameEn: 'John Doe',
 *   nameAr: 'جون دو'
 * });
 * 
 * // Get all people
 * const people = await peopleService.findAll();
 * 
 * // Update a person
 * const updated = await peopleService.update(id, {
 *   nameEn: 'John Smith'
 * });
 * ```
 */
export class PeopleService extends BaseService {
  /**
   * Creates a new person record
   * 
   * @param {CreatePersonDto} createPersonDto - Person creation data
   * @returns {Promise<Person>} Created person details
   * @throws {Error} If creation fails
   */
  async create(createPersonDto: CreatePersonDto): Promise<Person> {
    return this.handleRequest<Person>(
      this.client.people.personControllerCreate(createPersonDto) as unknown as AxiosPromise<Person>
    );
  }

  /**
   * Retrieves all people in the system
   * 
   * @returns {Promise<Person[]>} Array of all person records
   * @throws {Error} If retrieval fails
   */
  async findAll(): Promise<Person[]> {
    return this.handleRequest<Person[]>(
      this.client.people.personControllerFindAll() as unknown as AxiosPromise<Person[]>
    );
  }

  /**
   * Retrieves a specific person by their ID
   * 
   * @param {string} id - ID of the person to retrieve
   * @returns {Promise<Person>} Person details
   * @throws {Error} If person is not found or retrieval fails
   */
  async findOne(id: string): Promise<Person> {
    return this.handleRequest<Person>(
      this.client.people.personControllerFindOne(id) as unknown as AxiosPromise<Person>
    );
  }

  /**
   * Updates a person's information
   * 
   * @param {string} id - ID of the person to update
   * @param {UpdatePersonDto} updatePersonDto - Updated person data
   * @returns {Promise<Person>} Updated person details
   * @throws {Error} If update fails or person is not found
   */
  async update(id: string, updatePersonDto: UpdatePersonDto): Promise<Person> {
    return this.handleRequest<Person>(
      this.client.people.personControllerUpdate(id, updatePersonDto) as unknown as AxiosPromise<Person>
    );
  }

  /**
   * Removes a person from the system
   * 
   * @param {string} id - ID of the person to remove
   * @returns {Promise<void>}
   * @throws {Error} If deletion fails or person is not found
   */
  async remove(id: string): Promise<void> {
    await this.handleRequest<void>(
      this.client.people.personControllerRemove(id) as unknown as AxiosPromise<void>
    );
  }
} 