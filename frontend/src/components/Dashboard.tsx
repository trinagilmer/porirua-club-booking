import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface KpiBuckets {
  confirmed: number;
  pending: number;
  leads: number;
}

interface TableRow {
  name: string;
  status: string;
  event_date: string;
  size: number;
  room: string;
  created_at: string;
  last_emailed: string | null;
  value: number;
}

const Dashboard: React.FC = () => {
  const [kpiBuckets, setKpiBuckets] = useState<KpiBuckets>({ confirmed: 0, pending: 0, leads: 0 });
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [sortKey, setSortKey] = useState<keyof TableRow>('event_date');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    const from = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10);
    const to = new Date().toISOString().slice(0, 10);

    axios.get(`/api/dashboard/kpi-buckets?from=${from}&to=${to}`)
      .then(res => setKpiBuckets(res.data))
      .catch(console.error);

    axios.get('/api/dashboard/table')
      .then(res => setTableData(res.data))
      .catch(console.error);
  }, []);

  function sortTable(key: keyof TableRow) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const filteredData = tableData.filter(row =>
    filterStatus ? row.status.toLowerCase().includes(filterStatus.toLowerCase()) : true
  );

  const sortedData = filteredData.sort((a, b) => {
    if (a[sortKey] < b[sortKey]) return sortAsc ? -1 : 1;
    if (a[sortKey] > b[sortKey]) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div>
      <h2>Dashboard</h2>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
        <div>
          <h3>Confirmed $</h3>
          <p>${kpiBuckets.confirmed.toFixed(2)}</p>
        </div>
        <div>
          <h3>Pending $</h3>
          <p>${kpiBuckets.pending.toFixed(2)}</p>
        </div>
        <div>
          <h3>Leads $</h3>
          <p>{kpiBuckets.leads}</p>
        </div>
      </div>

      <div>
        <label htmlFor="statusFilter">Filter by Status:</label>
        <input
          id="statusFilter"
          type="text"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          placeholder="Status filter"
        />
      </div>

      <table border={1} cellPadding={5} cellSpacing={0} style={{ width: '100%', marginTop: '10px' }}>
        <thead>
          <tr>
            <th onClick={() => sortTable('name')}>Name</th>
            <th onClick={() => sortTable('status')}>Status</th>
            <th onClick={() => sortTable('event_date')}>Event Date/Time</th>
            <th onClick={() => sortTable('size')}>Size</th>
            <th onClick={() => sortTable('room')}>Room</th>
            <th onClick={() => sortTable('created_at')}>Created</th>
            <th onClick={() => sortTable('last_emailed')}>Last Emailed</th>
            <th onClick={() => sortTable('value')}>Value</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <tr key={idx}>
              <td>{row.name}</td>
              <td>{row.status}</td>
              <td>{new Date(row.event_date).toLocaleString()}</td>
              <td>{row.size}</td>
              <td>{row.room}</td>
              <td>{new Date(row.created_at).toLocaleDateString()}</td>
              <td>{row.last_emailed ? new Date(row.last_emailed).toLocaleDateString() : '-'}</td>
              <td>${row.value.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
