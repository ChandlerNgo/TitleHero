const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',  // replace with your MySQL username
    password: '',  // replace with your MySQL password
    database: 'landtitle'
});

async function authenticateUser(username, password) {
    try {
        // First check admin table
        const [adminRows] = await pool.execute(
            'SELECT adminID as id, username, password, "admin" as role FROM Admin WHERE username = ?',
            [username]
        );

        // Then check user table if not found in admin
        const [userRows] = await pool.execute(
            'SELECT userID as id, username, password, role FROM User WHERE username = ?',
            [username]
        );

        const user = adminRows[0] || userRows[0];
        
        if (!user) {
            return null;
        }

        // Use bcrypt to compare the password
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }

        return null;
    } catch (error) {
        console.error('Database authentication error:', error);
        return null;
    }
}

async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

// Example function to create a new user with a hashed password
async function createUser(username, password, role = 'user') {
    const hashedPassword = await hashPassword(password);
    const [result] = await pool.execute(
        'INSERT INTO User (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, role]
    );
    return result.insertId;
}

// Example function to create a new admin with a hashed password
async function createAdmin(username, password, permissions = null) {
    const hashedPassword = await hashPassword(password);
    const [result] = await pool.execute(
        'INSERT INTO Admin (username, password, permissions) VALUES (?, ?, ?)',
        [username, hashedPassword, permissions]
    );
    return result.insertId;
}

module.exports = {
    authenticateUser,
    hashPassword,
    createUser,
    createAdmin
};