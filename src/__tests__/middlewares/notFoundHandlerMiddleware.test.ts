import { app } from '../../server';
import request from 'supertest';

describe('404 Not found any endpoint (Integration Test)', () => {
  it('Should return 404', async () => {
    const response = await request(app).get('/api/endpoint/not/exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual(
      expect.objectContaining({
        message: expect.any(String),
        status: 'fail',
        statusCode: 404,
      }),
    );
  });

  it('Should NOT return 404', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
  });
});
