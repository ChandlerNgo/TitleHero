const bcrypt = require('bcrypt');
const getPool = require('../config');

async function authenticateUser(username, password) {
    try {
        const pool = await getPool();
        console.log('Attempting to authenticate user:', username);
        console.log('Password provided:', password);
        
        // First check admin table
        const [adminRows] = await pool.execute(
            'SELECT adminID as id, username as name, password, "admin" as role FROM Admin WHERE username = ?',
            [username]
        );
        console.log('Admin query results:', adminRows);
        
        if (adminRows.length > 0) {
            console.log('Found admin user, stored password hash:', adminRows[0].password);
        }

        // Then check user table if not found in admin
        const [userRows] = await pool.execute(
            'SELECT userID as id, username as name, password, role FROM User WHERE username = ?',
            [username]
        );
        console.log('User query results:', userRows);

        const user = adminRows[0] || userRows[0];
        
        if (!user) {
            console.log('No user found with this username');
            return null;
        }

        console.log('Found user:', { 
            id: user.id, 
            name: user.name,
            role: user.role,
            hasPassword: !!user.password 
        });

        try {
            // Use bcrypt to compare the password
            console.log('Attempting password comparison');
            const match = await bcrypt.compare(password, user.password);
            console.log('Password comparison result:', match);
            
            if (match) {
                console.log('Password matched, login successful');
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            } else {
                console.log('Password did not match');
            }
        } catch (error) {
            console.error('Error comparing passwords:', error);
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
    const pool = await getPool();
    const hashedPassword = await hashPassword(password);
    const [result] = await pool.execute(
        'INSERT INTO User (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, role]
    );
    return result.insertId;
}

// Example function to create a new admin with a hashed password
async function createAdmin(username, password, permissions = null) {
    console.log("Creating admin:", username);
    console.log("Password to hash:", password);
    const pool = await getPool();
    const hashedPassword = await hashPassword(password);
    console.log("Hashed password:", hashedPassword);
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