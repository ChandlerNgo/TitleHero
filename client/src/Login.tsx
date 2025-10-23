import React, { useState } from 'react';
import axios from 'axios';

interface LoginFormData {
    username: string;
    password: string;
}

interface LoginResponse {
    token: string;
    role: 'admin' | 'user';
    username: string;
}

const Login: React.FC = () => {
    const [formData, setFormData] = useState<LoginFormData>({
        username: '',
        password: ''
    });
    const [error, setError] = useState<string>('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post<LoginResponse>('http://localhost:3001/api/login', formData);
            if (response.data.token) {
                // Store the auth data in localStorage
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('role', response.data.role);
                localStorage.setItem('username', response.data.username);
                // Redirect to appropriate dashboard based on role
                const redirectPath = response.data.role === 'admin' ? '/admin-dashboard' : '/dashboard';
                window.location.href = redirectPath;
                console.log('Login successful');
            }
        } catch (err) {
            setError('Invalid username or password');
            console.error('Login error:', err);
        }
    };

    return (
        <div className="login-container">
            <form onSubmit={handleSubmit}>
                <h2>Login</h2>
                {error && <div className="error-message">{error}</div>}
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default Login;