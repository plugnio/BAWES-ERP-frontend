'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { peopleService, PERMISSIONS } from '@/services/peopleService';
import { jwt } from '@/lib/jwt';

interface Person {
    id: string;
    email: string;
    nameEn: string;
    nameAr: string;
    roleId: string;
}

export default function PeoplePage() {
    const [people, setPeople] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Permission checks
    const canView = jwt.hasPermission(PERMISSIONS.PEOPLE.VIEW);
    const canCreate = jwt.hasPermission(PERMISSIONS.PEOPLE.CREATE);
    const canUpdate = jwt.hasPermission(PERMISSIONS.PEOPLE.UPDATE);
    const canDelete = jwt.hasPermission(PERMISSIONS.PEOPLE.DELETE);

    useEffect(() => {
        loadPeople();
    }, []);

    const loadPeople = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await peopleService.listPeople();
            setPeople(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load people');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this person?')) return;
        
        try {
            await peopleService.deletePerson(id);
            setPeople(people.filter(p => p.id !== id));
        } catch (err: any) {
            setError(err.message || 'Failed to delete person');
        }
    };

    if (!canView) {
        return (
            <div className="p-4">
                <Card>
                    <CardContent>
                        <p className="text-center text-red-600">
                            You do not have permission to view people
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (loading) {
        return <div className="p-4">Loading...</div>;
    }

    if (error) {
        return (
            <div className="p-4">
                <Card>
                    <CardContent>
                        <p className="text-center text-red-600">{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>People Management</CardTitle>
                    {canCreate && (
                        <Button onClick={() => {/* Open create modal */}}>
                            Add Person
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {people.map(person => (
                            <div 
                                key={person.id} 
                                className="flex items-center justify-between p-4 border rounded"
                            >
                                <div>
                                    <h3 className="font-medium">{person.nameEn}</h3>
                                    <p className="text-sm text-gray-600">{person.email}</p>
                                </div>
                                <div className="space-x-2">
                                    {canUpdate && (
                                        <Button 
                                            variant="outline"
                                            onClick={() => {/* Open edit modal */}}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                    {canDelete && (
                                        <Button 
                                            variant="destructive"
                                            onClick={() => handleDelete(person.id)}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 