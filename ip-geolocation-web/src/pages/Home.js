import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { geoAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to update map center
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const Home = () => {
  const { user, logout } = useAuth();
  const [ipInput, setIpInput] = useState('');
  const [geoData, setGeoData] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistories, setSelectedHistories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    fetchUserGeoLocation();
    fetchHistory();
  }, []);

  const fetchUserGeoLocation = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await geoAPI.getGeoLocation();
      if (response.data.success) {
        setGeoData(response.data.data);
        setMapKey(prev => prev + 1);
      }
    } catch (err) {
      setError('Failed to fetch your geolocation');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await geoAPI.getHistory();
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const validateIP = (ip) => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');

    if (!ipInput.trim()) {
      setError('Please enter an IP address');
      return;
    }

    if (!validateIP(ipInput.trim())) {
      setError('Please enter a valid IP address');
      return;
    }

    setLoading(true);
    try {
      const response = await geoAPI.getGeoLocation(ipInput.trim());
      if (response.data.success) {
        setGeoData(response.data.data);
        setMapKey(prev => prev + 1);
        fetchHistory();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch geolocation for this IP');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setIpInput('');
    setError('');
    setSelectedHistories([]);
    fetchUserGeoLocation();
  };

  const handleHistoryClick = (historyItem) => {
    setGeoData(historyItem.geo_data);
    setIpInput(historyItem.ip_address);
    setMapKey(prev => prev + 1);
    setError('');
  };

  const handleCheckboxChange = (id) => {
    setSelectedHistories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedHistories.length === history.length) {
      setSelectedHistories([]);
    } else {
      setSelectedHistories(history.map(item => item.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedHistories.length === 0) return;

    if (!window.confirm(`Delete ${selectedHistories.length} item(s)?`)) {
      return;
    }

    try {
      await geoAPI.deleteHistory(selectedHistories);
      setSelectedHistories([]);
      fetchHistory();
    } catch (err) {
      setError('Failed to delete history');
    }
  };

  const getCoordinates = () => {
    if (geoData && geoData.loc) {
      const [lat, lng] = geoData.loc.split(',').map(Number);
      return [lat, lng];
    }
    return [0, 0];
  };

  const [lat, lng] = getCoordinates();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Simple Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">IP Geolocation</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.name}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="Enter IP address (Example: 8.8.8.8)"
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
              Clear
            </button>
          </form>
          
          {error && (
            <div className="mt-3 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - Geo Info & Map */}
          <div className="lg:col-span-2 space-y-6">
            {/* Geolocation Info */}
            {geoData ? (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Location Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">IP Address</p>
                      <p className="font-semibold">{geoData.ip}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">City</p>
                      <p className="font-semibold">{geoData.city || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Region</p>
                      <p className="font-semibold">{geoData.region || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Country</p>
                      <p className="font-semibold">{geoData.country || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Coordinates</p>
                      <p className="font-semibold">{geoData.loc || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Timezone</p>
                      <p className="font-semibold">{geoData.timezone || 'N/A'}</p>
                    </div>
                    {geoData.postal && (
                      <div>
                        <p className="text-sm text-gray-500">Postal Code</p>
                        <p className="font-semibold">{geoData.postal}</p>
                      </div>
                    )}
                    {geoData.org && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-500">Organization</p>
                        <p className="font-semibold">{geoData.org}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Map */}
                {geoData.loc && (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="h-96">
                      <MapContainer
                        key={mapKey}
                        center={[lat, lng]}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <ChangeView center={[lat, lng]} zoom={13} />
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; OpenStreetMap'
                        />
                        <Marker position={[lat, lng]}>
                          <Popup>
                            <strong>{geoData.city}</strong><br />
                            {geoData.country}<br />
                            {geoData.ip}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </div>
                )}
              </>
            ) : loading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 text-lg">Enter an IP address to get started</p>
              </div>
            )}
          </div>

          {/* Right Side - History */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-semibold">Search History</h3>
                {history.length > 0 && (
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-500 hover:text-blue-700"
                  >
                    {selectedHistories.length === history.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {selectedHistories.length > 0 && (
                <div className="p-3 bg-red-50 border-b flex justify-between items-center">
                  <span className="text-sm text-red-700">{selectedHistories.length} selected</span>
                  <button
                    onClick={handleDeleteSelected}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}

              <div className="max-h-[600px] overflow-y-auto">
                {history.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No search history</p>
                  </div>
                ) : (
                  <div>
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 border-b hover:bg-gray-50 flex items-start gap-3"
                      >
                        <input
                          type="checkbox"
                          checked={selectedHistories.includes(item.id)}
                          onChange={() => handleCheckboxChange(item.id)}
                          className="mt-1 cursor-pointer"
                        />
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleHistoryClick(item)}
                        >
                          <p className="font-semibold text-blue-600">{item.ip_address}</p>
                          <p className="text-sm text-gray-600">
                            {item.geo_data?.city}, {item.geo_data?.country}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;