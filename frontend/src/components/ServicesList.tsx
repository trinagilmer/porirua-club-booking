import React, { useState, useEffect } from 'react';
import axios from 'axios';

const userRole = 'manager'; // This should come from auth context

export default function ServicesList() {
  const [services, setServices] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    const res = await axios.get('/api/services/catalog');
    setServices(res.data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (userRole !== 'manager' && userRole !== 'admin') {
      alert('You do not have permission to perform this action.');
      return;
    }
    await axios.post('/api/services/catalog', { name, description, active }, { headers: { 'x-user-role': userRole } });
    setName('');
    setDescription('');
    setActive(true);
    fetchServices();
  }

  return (
    <div>
      <h2>Services Catalog</h2>
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
        <label className="mr-2">
          <input type="checkbox" checked={active} onChange={() => setActive(!active)} /> Active
        </label>
        <button type="submit" className="bg-blue-500 text-white p-2">
          Add
        </button>
      </form>
      <ul>
        {services.map((service: any) => (
          <li key={service.id} className="mb-2">
            <strong>{service.name}</strong> - {service.active ? 'Active' : 'Inactive'}
          </li>
        ))}
      </ul>
    </div>
  );
}
