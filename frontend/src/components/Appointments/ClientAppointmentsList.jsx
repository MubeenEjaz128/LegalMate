import React from 'react';
import { useNavigate } from 'react-router-dom';

const ClientAppointmentsList = ({ appointments }) => {
  const navigate = useNavigate();

  if (!appointments || appointments.length === 0) {
    return <div className="text-gray-500">No appointments found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-xl shadow">
        <thead>
          <tr>
            <th className="px-4 py-2">Lawyer</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Time</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((apt) => (
            <tr key={apt._id}>
              <td className="px-4 py-2">{apt.lawyer?.name || 'Lawyer'}</td>
              <td className="px-4 py-2">{apt.date}</td>
              <td className="px-4 py-2">{apt.time}</td>
              <td className="px-4 py-2 capitalize">{apt.consultationType}</td>
              <td className="px-4 py-2 capitalize">{apt.status}</td>
              <td className="px-4 py-2">
                <button
                  className="btn-primary text-xs"
                  onClick={() => navigate(`/consultation/${apt._id}`)}
                >
                  {apt.status === 'confirmed' ? 'Join' : 'Details'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientAppointmentsList;