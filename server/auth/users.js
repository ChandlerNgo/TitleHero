const users = [
    {
        username: "admin",
        password: "admin123",  // hash this before data is added to database
        role: "admin"
    },
    {
        username: "user",
        password: "user123",   // hash this before data is added to database
        role: "user"
    }
];

function authenticateUser(username, password) {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        // Don't send password back in response
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    return null;
}

module.exports = {
    authenticateUser
};