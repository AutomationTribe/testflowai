import { afterEach, describe, expect, it } from 'vitest';
import { assertSafeTestDatabase, DEFAULT_TEST_DATABASE_URL } from './testDatabaseGuard.js';

describe('assertSafeTestDatabase', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  afterEach(() => {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  it('accepts a local database whose name ends in _test', () => {
    expect(assertSafeTestDatabase(DEFAULT_TEST_DATABASE_URL)).toEqual({ host: 'localhost', databaseName: 'testflow_test' });
    expect(assertSafeTestDatabase('postgres://u:p@127.0.0.1:55432/other_test').databaseName).toBe('other_test');
    expect(assertSafeTestDatabase('postgres://u:p@[::1]:5432/x_test').host).toBe('[::1]');
  });

  it.each([
    ['the dev database', 'postgres://testflow:testflow@localhost:5432/testflow'],
    ['the E2E database', 'postgres://testflow:testflow@localhost:5432/testflow_e2e'],
    ['the postgres maintenance database', 'postgres://testflow:testflow@localhost:5432/postgres'],
    ['no database name', 'postgres://testflow:testflow@localhost:5432'],
    ['a name that only contains "test"', 'postgres://testflow:testflow@localhost:5432/testflow_testing'],
    ['an uppercase look-alike', 'postgres://testflow:testflow@localhost:5432/TESTFLOW_TEST'],
    ['a name that starts with an underscore', 'postgres://testflow:testflow@localhost:5432/_test'],
  ])('refuses %s', (_label, url) => {
    expect(() => assertSafeTestDatabase(url)).toThrow(/Refusing/);
  });

  it('refuses a remote host even when the database name ends in _test', () => {
    expect(() => assertSafeTestDatabase('postgres://u:p@ep-cool-123.neon.tech/app_test')).toThrow(/non-local host/);
    expect(() => assertSafeTestDatabase('postgres://u:p@localhost.evil.example/app_test')).toThrow(/non-local host/);
  });

  it('is not fooled by a *_test name placed in the query string or userinfo', () => {
    expect(() => assertSafeTestDatabase('postgres://localhost/testflow?dbname=x_test')).toThrow(/Refusing/);
    expect(() => assertSafeTestDatabase('postgres://x_test@localhost/testflow')).toThrow(/Refusing/);
  });

  it('refuses a query string, because pg lets ?host= override the host the guard checked', () => {
    expect(() => assertSafeTestDatabase('postgres://u:p@localhost/x_test?host=evil.example')).toThrow(/query string/);
    expect(() => assertSafeTestDatabase('postgres://u:p@localhost/x_test?host=/var/run/postgresql')).toThrow(/query string/);
    expect(() => assertSafeTestDatabase('postgres:///x_test?host=evil.example')).toThrow(/Refusing/);
    expect(() => assertSafeTestDatabase('postgres://u:p@localhost/x_test?sslmode=disable')).toThrow(/query string/);
  });

  it('accepts the postgresql:// scheme and refuses other schemes and look-alike hosts', () => {
    expect(assertSafeTestDatabase('postgresql://u:p@localhost:5432/x_test').databaseName).toBe('x_test');
    expect(() => assertSafeTestDatabase('mysql://u:p@localhost/x_test')).toThrow(/postgres:\/\//);
    expect(() => assertSafeTestDatabase('postgres://u:p@localhost./x_test')).toThrow(/non-local host/);
    expect(() => assertSafeTestDatabase('postgres://u:p@127.1/x_test')).toThrow(/non-local host/);
    expect(() => assertSafeTestDatabase('postgres://u:p@0.0.0.0/x_test')).toThrow(/non-local host/);
  });

  it('refuses in production mode, even for a valid test database', () => {
    process.env.NODE_ENV = 'production';
    expect(() => assertSafeTestDatabase(DEFAULT_TEST_DATABASE_URL)).toThrow(/production/);
  });

  it('refuses a missing or unparseable URL', () => {
    expect(() => assertSafeTestDatabase(undefined)).toThrow(/no database URL/);
    expect(() => assertSafeTestDatabase('not a url')).toThrow(/cannot be parsed/);
  });
});
