import { PeopleApi } from '@bawes/erp-api-sdk';
import { sdkConfig } from '@/lib/sdk-config';
import { jwt } from '@/lib/jwt';

// Define permissions as constants
export const PERMISSIONS = {
    PEOPLE: {
        VIEW: 1 << 0,   // 1
        CREATE: 1 << 1,  // 2
        UPDATE: 1 << 2,  // 4
        DELETE: 1 << 3   // 8
    }
} as const;

// Create API instance
const peopleApi = new PeopleApi(sdkConfig);

export const peopleService = {
    // List people with permission check
    async listPeople() {
        if (!jwt.hasPermission(PERMISSIONS.PEOPLE.VIEW)) {
            throw new Error('You do not have permission to view people');
        }
        const response = await peopleApi.personControllerFindAll();
        return response.data;
    },

    // Get single person
    async getPerson(id: string) {
        if (!jwt.hasPermission(PERMISSIONS.PEOPLE.VIEW)) {
            throw new Error('You do not have permission to view people');
        }
        const response = await peopleApi.personControllerFindOne(id);
        return response.data;
    },

    // Create person
    async createPerson(data: {
        nameEn?: string;
        nameAr?: string;
        passwordHash: string;
        accountStatus: string;
    }) {
        if (!jwt.hasPermission(PERMISSIONS.PEOPLE.CREATE)) {
            throw new Error('You do not have permission to create people');
        }
        const response = await peopleApi.personControllerCreate(data);
        return response.data;
    },

    // Update person
    async updatePerson(id: string, data: {
        nameEn?: string;
        nameAr?: string;
        accountStatus?: string;
    }) {
        if (!jwt.hasPermission(PERMISSIONS.PEOPLE.UPDATE)) {
            throw new Error('You do not have permission to update people');
        }
        const response = await peopleApi.personControllerUpdate(id, data);
        return response.data;
    },

    // Delete person
    async deletePerson(id: string) {
        if (!jwt.hasPermission(PERMISSIONS.PEOPLE.DELETE)) {
            throw new Error('You do not have permission to delete people');
        }
        await peopleApi.personControllerRemove(id);
    }
}; 