import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function MenuItemsList() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchItems();
  }, []);

  async function fetchCategories() {
    const res = await axios.get('/api/menu/categories');
    setCategories(res.data);
    if (res.data.length > 0) setCategory(res.data[0].id);
  }

  async function fetchItems() {
    const res = await axios.get('/api/menu/items');
    setItems(res.data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await axios.post('/api/menu/items', { category_id: category, name, description, price: parseFloat(price), active });
    setName('');
    setDescription('');
    setPrice('');
    setActive(true);
    fetchItems();
  }

  return (
    <div>
      <h2>Menu Items</h2>
      <form onSubmit={handleSubmit} className="mb-4">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="border p-2 mr-2">
          {categories.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
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
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2 mr-2"
          step="0.01"
          min="0"
        />
        <label className="mr-2">
          <input type="checkbox" checked={active} onChange={() => setActive(!active)} /> Active
        </label>
        <button type="submit" className="bg-blue-500 text-white p-2">
          Add
        </button>
      </form>
      <ul>
        {items.map((item: any) => (
          <li key={item.id} className="mb-2">
            <strong>{item.name}</strong> ({item.category_id}) - ${item.price?.toFixed(2)} - {item.active ? 'Active' : 'Inactive'}
          </li>
        ))}
      </ul>
    </div>
  );
}
