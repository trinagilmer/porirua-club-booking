import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function MenuCategoriesList() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const res = await axios.get('/api/menu/categories');
    setCategories(res.data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await axios.post('/api/menu/categories', { name, description });
    setName('');
    setDescription('');
    fetchCategories();
  }

  return (
    <div>
      <h2>Menu Categories</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border p-2 mr-2"
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 mr-2"
        />
        <button type="submit" className="bg-blue-500 text-white p-2">Add</button>
      </form>
      <ul>
        {categories.map((cat: any) => (
          <li key={cat.id} className="mb-2">
            <strong>{cat.name}</strong>: {cat.description}
          </li>
        ))}
      </ul>
    </div>
  );
}
