const runMigrations = require('../src/scripts/runMigrations');
const sequelize = require('../src/config/database');
const fs = require('fs/promises');
const path = require('path');

jest.mock('fs/promises');
jest.mock('path');

describe('Database Migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should read the SQL file and execute it', async () => {
    const mockSql = 'CREATE TABLE incidents ();';
    path.join.mockReturnValue('/path/to/001_init.sql');
    fs.readFile.mockResolvedValue(mockSql);
    sequelize.authenticate = jest.fn().mockResolvedValue(true);
    sequelize.query = jest.fn().mockResolvedValue(true);

    await runMigrations();

    expect(fs.readFile).toHaveBeenCalledWith('/path/to/001_init.sql', 'utf8');
    expect(sequelize.query).toHaveBeenCalledWith(mockSql);
  });

  it('should gracefully handle errors', async () => {
    path.join.mockReturnValue('/path/to/001_init.sql');
    fs.readFile.mockResolvedValue('SQL');
    sequelize.authenticate = jest.fn().mockRejectedValue(new Error('DB Down'));
    
    // The console.error will be called, let's spy on it
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    await expect(runMigrations()).rejects.toThrow('DB Down');
    
    expect(consoleSpy).toHaveBeenCalledWith('Migration failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
