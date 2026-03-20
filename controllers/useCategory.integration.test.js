// Aw Jean Leng Adrian, A0277537N

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import request from 'supertest';
import axios from 'axios';

import categoryModel from '../models/categoryModel.js';
import { categoryController } from '../controllers/categoryController.js';

jest.setTimeout(30000);

describe('useCategory Hook - Backend Integration Tests (API Endpoint)', () => {
    let mongoServer;
    let app;
    let server;
    let baseURL;

    // Setup Express server with real category endpoint (same endpoint useCategory calls)
    const setupTestServer = () => {
        const testApp = express();
        testApp.use(express.json());
        testApp.get('/api/v1/category/get-category', categoryController);
        return testApp;
    };

    // Seed database with test categories
    const seedCategories = async (categories) => {
        await categoryModel.deleteMany({});
        const created = [];
        for (const cat of categories) {
            const c = await categoryModel.create(cat);
            created.push(c);
        }
        return created;
    };

    beforeAll(async () => {
        // Start MongoDB Memory Server
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri(), {
            dbName: 'useCategory-api-integration-tests',
        });

        // Setup Express test server
        app = setupTestServer();
        server = app.listen(0); // Random available port
        const address = server.address();
        baseURL = `http://localhost:${address.port}`;
    });

    beforeEach(async () => {
        await categoryModel.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
        server.close();
    });

    describe('Hook Initialization - API Endpoint Behavior', () => {
        test('GET /api/v1/category/get-category → verify endpoint returns correct structure', async () => {
            await seedCategories([
                { name: 'Electronics', slug: 'electronics' },
            ]);

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Verify response structure that hook expects
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('category');
            expect(Array.isArray(response.body.category)).toBe(true);
        });

        test('Axios GET to endpoint (simulating what hook does) → verify correct endpoint called', async () => {
            await seedCategories([
                { name: 'Test', slug: 'test' },
            ]);

            axios.defaults.baseURL = baseURL;
            const { data } = await axios.get('/api/v1/category/get-category');

            expect(data).toHaveProperty('category');
            expect(Array.isArray(data.category)).toBe(true);

            delete axios.defaults.baseURL;
        });
    });

    describe('Successful Data Fetching - What Hook Receives', () => {
        test('Seed DB with 3 categories (Electronics, Books, Clothing) → API returns 3 categories', async () => {
            await seedCategories([
                { name: 'Electronics', slug: 'electronics' },
                { name: 'Books', slug: 'books' },
                { name: 'Clothing', slug: 'clothing' },
            ]);

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Hook would extract data.category
            expect(response.body.category).toHaveLength(3);
            expect(response.body.category[0].name).toBe('Electronics');
            expect(response.body.category[1].name).toBe('Books');
            expect(response.body.category[2].name).toBe('Clothing');
        });

        test('Verify each category has _id, name, slug fields matching DB documents', async () => {
            const seeded = await seedCategories([
                { name: 'Electronics', slug: 'electronics' },
                { name: 'Books', slug: 'books' },
            ]);

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Verify fields match DB
            expect(response.body.category[0]._id).toBe(seeded[0]._id.toString());
            expect(response.body.category[0].name).toBe(seeded[0].name);
            expect(response.body.category[0].slug).toBe(seeded[0].slug);

            expect(response.body.category[1]._id).toBe(seeded[1]._id.toString());
            expect(response.body.category[1].name).toBe(seeded[1].name);
            expect(response.body.category[1].slug).toBe(seeded[1].slug);
        });

        test('Verify data flow: DB → categoryController → API response → what hook receives', async () => {
            // Seed DB
            const seeded = await seedCategories([
                { name: 'Test Category', slug: 'test-category' },
            ]);

            // Verify data in DB
            const dbCategories = await categoryModel.find({});
            expect(dbCategories).toHaveLength(1);

            // API call (what hook does)
            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Verify API response matches DB
            expect(response.body.category[0]._id).toBe(seeded[0]._id.toString());
            expect(response.body.category[0].name).toBe('Test Category');
        });

        test('Compare API response with direct DB query to confirm data accuracy', async () => {
            await seedCategories([
                { name: 'Category A', slug: 'category-a' },
                { name: 'Category B', slug: 'category-b' },
                { name: 'Category C', slug: 'category-c' },
            ]);

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Query DB directly
            const dbCategories = await categoryModel.find({});

            // Compare
            expect(response.body.category).toHaveLength(dbCategories.length);
            response.body.category.forEach((apiCat, index) => {
                expect(apiCat._id).toBe(dbCategories[index]._id.toString());
                expect(apiCat.name).toBe(dbCategories[index].name);
                expect(apiCat.slug).toBe(dbCategories[index].slug);
            });
        });
    });

    describe('API Response Integration - Hook Data Extraction', () => {
        test('Backend returns {success: true, category: [...]} → verify data.category structure', async () => {
            await seedCategories([
                { name: 'Electronics', slug: 'electronics' },
            ]);

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Hook extracts data?.category
            expect(response.body.success).toBe(true);
            expect(response.body.category).toBeDefined();
            expect(Array.isArray(response.body.category)).toBe(true);
            expect(response.body.category[0].name).toBe('Electronics');
        });

        test('Backend returns empty category array → verify response structure for hook', async () => {
            // Don't seed any categories
            await categoryModel.deleteMany({});

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Hook would use data?.category || []
            expect(response.body.category).toBeDefined();
            expect(response.body.category).toEqual([]);
            expect(Array.isArray(response.body.category)).toBe(true);
        });

        test('Verify response always includes category field (for hook fallback logic)', async () => {
            await seedCategories([
                { name: 'Test', slug: 'test' },
            ]);

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Hook relies on data?.category structure
            expect(response.body).toHaveProperty('category');
            expect(response.body.category).not.toBeNull();
            expect(response.body.category).not.toBeUndefined();
        });
    });

    describe('Error Handling - What Hook Would Receive', () => {
        test('Backend API returns 500 error → verify error response structure', async () => {
            // Break the database to cause 500 error
            await mongoose.connection.close();

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(500);

            // Hook would catch this error
            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');

            // Reconnect for cleanup
            await mongoose.connect(mongoServer.getUri(), {
                dbName: 'useCategory-api-integration-tests',
            });
        });

        test('Empty database → API returns empty array (not error)', async () => {
            await categoryModel.deleteMany({});

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Hook should receive empty array, not error
            expect(response.body.success).toBe(true);
            expect(response.body.category).toEqual([]);
        });
    });

    describe('Single API Call Behavior', () => {
        test('Multiple requests to endpoint → each returns current DB state', async () => {
            // First request with 1 category
            await seedCategories([
                { name: 'First', slug: 'first' },
            ]);

            const response1 = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            expect(response1.body.category).toHaveLength(1);

            // Add another category
            await categoryModel.create({ name: 'Second', slug: 'second' });

            // Second request should reflect new state
            const response2 = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            expect(response2.body.category).toHaveLength(2);
        });
    });

    describe('API Return Value Structure', () => {
        test('After successful fetch → verify API returns array of category objects', async () => {
            await seedCategories([
                { name: 'Electronics', slug: 'electronics' },
                { name: 'Books', slug: 'books' },
            ]);

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Hook extracts this array
            const categories = response.body.category;
            expect(Array.isArray(categories)).toBe(true);
            expect(categories).toHaveLength(2);

            const names = categories.map(cat => cat.name);
            expect(names).toEqual(['Electronics', 'Books']);
        });

        test('Verify return type matches expected interface: Array<{_id, name, slug}>', async () => {
            await seedCategories([
                { name: 'Test Category', slug: 'test-category' },
            ]);

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            const category = response.body.category[0];
            expect(category).toHaveProperty('_id');
            expect(category).toHaveProperty('name');
            expect(category).toHaveProperty('slug');
            expect(typeof category._id).toBe('string');
            expect(typeof category.name).toBe('string');
            expect(typeof category.slug).toBe('string');
        });
    });

    describe('Integration with categoryController', () => {
        test('Verify API response has exact data structure from categoryController', async () => {
            const seeded = await seedCategories([
                { name: 'Controller Test', slug: 'controller-test' },
            ]);

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Verify structure matches categoryController
            expect(response.body).toEqual({
                success: true,
                message: 'All Categories List',
                category: [
                    expect.objectContaining({
                        _id: seeded[0]._id.toString(),
                        name: 'Controller Test',
                        slug: 'controller-test',
                    }),
                ],
            });
        });

        test('Seed 5 categories → verify API returns all 5 in same order as controller', async () => {
            await seedCategories([
                { name: 'Cat 1', slug: 'cat-1' },
                { name: 'Cat 2', slug: 'cat-2' },
                { name: 'Cat 3', slug: 'cat-3' },
                { name: 'Cat 4', slug: 'cat-4' },
                { name: 'Cat 5', slug: 'cat-5' },
            ]);

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            expect(response.body.category).toHaveLength(5);

            // Verify order
            for (let i = 0; i < 5; i++) {
                expect(response.body.category[i].name).toBe(`Cat ${i + 1}`);
                expect(response.body.category[i].slug).toBe(`cat-${i + 1}`);
            }
        });

        test('Update category in DB → next API call returns updated data', async () => {
            const seeded = await seedCategories([
                { name: 'Original Name', slug: 'original-name' },
            ]);

            // First API call
            const response1 = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            expect(response1.body.category[0].name).toBe('Original Name');

            // Update in DB
            await categoryModel.findByIdAndUpdate(seeded[0]._id, {
                name: 'Updated Name',
                slug: 'updated-name',
            });

            // Second API call (simulating hook remount/refetch)
            const response2 = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Should have updated data
            expect(response2.body.category[0].name).toBe('Updated Name');
            expect(response2.body.category[0].slug).toBe('updated-name');
        });
    });

    describe('DB Persistence Verification', () => {
        test('Seed categories → API call → query DB independently → verify exact match', async () => {
            const seeded = await seedCategories([
                { name: 'DB Test 1', slug: 'db-test-1' },
                { name: 'DB Test 2', slug: 'db-test-2' },
            ]);

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Query DB independently
            const dbCategories = await categoryModel.find({});

            // Verify exact match
            expect(response.body.category).toHaveLength(dbCategories.length);
            response.body.category.forEach((apiCat, i) => {
                expect(apiCat._id).toBe(dbCategories[i]._id.toString());
                expect(apiCat.name).toBe(dbCategories[i].name);
                expect(apiCat.slug).toBe(dbCategories[i].slug);
            });
        });

        test('Verify no data transformation between DB → API (data integrity maintained)', async () => {
            await seedCategories([
                { name: 'Integrity Test', slug: 'integrity-test' },
            ]);

            // Get data from DB
            const dbCategory = await categoryModel.findOne({ slug: 'integrity-test' });

            const response = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);

            // Verify no transformation
            const apiCategory = response.body.category[0];
            expect(apiCategory._id).toBe(dbCategory._id.toString());
            expect(apiCategory.name).toBe(dbCategory.name);
            expect(apiCategory.slug).toBe(dbCategory.slug);
        });

        test('Test with 0, 1, and 10 categories → verify API handles all cases correctly', async () => {
            // Test 0 categories
            await categoryModel.deleteMany({});
            const response0 = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);
            expect(response0.body.category).toHaveLength(0);

            // Test 1 category
            await seedCategories([{ name: 'Single', slug: 'single' }]);
            const response1 = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);
            expect(response1.body.category).toHaveLength(1);

            // Test 10 categories
            const tenCats = Array.from({ length: 10 }, (_, i) => ({
                name: `Category ${i + 1}`,
                slug: `category-${i + 1}`,
            }));
            await seedCategories(tenCats);
            const response10 = await request(app)
                .get('/api/v1/category/get-category')
                .expect(200);
            expect(response10.body.category).toHaveLength(10);
        });
    });

    describe('Real Axios Integration (Simulating Hook)', () => {
        test('Use real axios to call endpoint → verify same behavior as supertest', async () => {
            await seedCategories([
                { name: 'Axios Test', slug: 'axios-test' },
            ]);

            axios.defaults.baseURL = baseURL;

            const { data } = await axios.get('/api/v1/category/get-category');

            // Hook would extract data?.category
            expect(data.category).toBeDefined();
            expect(Array.isArray(data.category)).toBe(true);
            expect(data.category[0].name).toBe('Axios Test');

            delete axios.defaults.baseURL;
        });

        test('Real axios with error handling → verify hook error scenario', async () => {
            axios.defaults.baseURL = baseURL;

            // Close DB to cause error
            await mongoose.connection.close();

            try {
                await axios.get('/api/v1/category/get-category');
                fail('Should have thrown error');
            } catch (error) {
                // Hook would catch this in try-catch
                expect(error.response.status).toBe(500);
                expect(error.response.data.success).toBe(false);
            }

            // Reconnect
            await mongoose.connect(mongoServer.getUri(), {
                dbName: 'useCategory-api-integration-tests',
            });

            delete axios.defaults.baseURL;
        });
    });
});