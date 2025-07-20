import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { apiService } from '../utils/api';
import { CheckCircle, XCircle, Plus, Key, Eye, EyeOff, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface Exchange {
  value: string;
  label: string;
  image?: string;
}

interface ConnectedExchange {
  name: string;
  connected: boolean;
  image?: string;
}


interface ConnectionModal {
  isOpen: boolean;
  exchange: Exchange | null;
}

export const Exchanges: React.FC = () => {
  const [supportedExchanges, setSupportedExchanges] = useState<Exchange[]>([]);
  const [connectedExchanges, setConnectedExchanges] = useState<ConnectedExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionModal, setConnectionModal] = useState<ConnectionModal>({ isOpen: false, exchange: null });
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchExchanges();
  }, []);

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const [supportedResponse, connectedResponse] = await Promise.all([
        apiService.getExchanges(),
        apiService.getConnectedExchanges()
      ]);

      console.log('Supported exchanges:', supportedResponse);
      console.log('Connected exchanges:', connectedResponse);

      setSupportedExchanges(supportedResponse);
      setConnectedExchanges(connectedResponse.exchanges || []);
    } catch (error) {
      console.error('Failed to fetch exchanges:', error);
      toast.error('Failed to load exchanges');
    } finally {
      setLoading(false);
    }
  };

  const isExchangeConnected = (exchangeValue: string) => {
    return connectedExchanges.some(ex => 
      ex.name.toLowerCase() === exchangeValue.toLowerCase() && ex.connected
    );
  };

  const getExchangeStatus = (exchangeValue: string) => {
    const connected = connectedExchanges.find(ex => 
      ex.name.toLowerCase() === exchangeValue.toLowerCase()
    );
    return connected?.connected ? 'connected' : 'disconnected';
  };

  const handleConnectExchange = (exchange: Exchange) => {
    setConnectionModal({ isOpen: true, exchange });
    setApiKey('');
    setApiSecret('');
  };

  const handleSubmitConnection = async () => {
    if (!connectionModal.exchange || !apiKey.trim() || !apiSecret.trim()) {
      toast.error('Please provide both API key and secret');
      return;
    }

    try {
      setConnecting(true);
      
      await apiService.connectExchange(
        connectionModal.exchange.value,
        apiKey.trim(),
        apiSecret.trim()
      );
      
      toast.success(`Successfully connected to ${connectionModal.exchange.label}!`);
      
      // Add a small delay to allow server to process the connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the exchanges list
      await fetchExchanges();
      
      // Close modal
      setConnectionModal({ isOpen: false, exchange: null });
      setApiKey('');
      setApiSecret('');
    } catch (error: any) {
      console.error('Connection failed:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to connect exchange';
      toast.error(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectExchange = async (exchangeName: string) => {
    try {
      // Remove from localStorage since server doesn't have proper disconnect endpoint
      const connectedExchanges = JSON.parse(localStorage.getItem('connectedExchanges') || '[]');
      const updatedExchanges = connectedExchanges.map((ex: any) => 
        ex.name.toLowerCase() === exchangeName.toLowerCase() 
          ? { ...ex, connected: false }
          : ex
      );
      
      localStorage.setItem('connectedExchanges', JSON.stringify(updatedExchanges));
      
      toast.success(`Successfully disconnected from ${exchangeName}!`);
      
      // Refresh the exchanges list to update UI
      await fetchExchanges();
    } catch (error) {
      console.error('Failed to disconnect exchange:', error);
      toast.error('Failed to disconnect exchange');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <div className="absolute inset-0 rounded-full h-12 w-12 border-t-2 border-blue-500 animate-spin animation-delay-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-white">Exchange Management</h1>
        <p className="text-lg text-gray-400">
          Connect your cryptocurrency exchanges to start automated trading
        </p>
      </div>

      {/* Connected Exchanges Summary */}
      {connectedExchanges.length > 0 && (
        <Card className="border-green-500/20 bg-green-500/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Connected Exchanges ({connectedExchanges.filter(ex => ex.connected).length})</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {connectedExchanges.filter(ex => ex.connected).map((exchange, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-green-400">
                      {exchange.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-white font-medium">{exchange.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-400 hover:text-red-300"
                  onClick={() => handleDisconnectExchange(exchange.name)}
                >
                  Disconnect
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Supported Exchanges */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Available Exchanges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {supportedExchanges.map((exchange) => {
            const isConnected = isExchangeConnected(exchange.value);
            const status = getExchangeStatus(exchange.value);
            
            return (
              <Card key={exchange.value} hover glow className="group relative overflow-hidden">
                {/* Exchange Logo/Icon */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                      {exchange.image ? (
                        <img 
                          src={exchange.image} 
                          alt={exchange.label}
                          className="w-8 h-8 rounded"
                          onError={(e) => {
                            // Fallback to text if image fails
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                          }}
                        />
                      ) : null}
                      <span 
                        className="text-lg font-bold text-white"
                        style={{ display: exchange.image ? 'none' : 'block' }}
                      >
                        {exchange.label.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{exchange.label}</h3>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(status)}
                        <span className={`text-sm capitalize ${
                          status === 'connected' ? 'text-green-400' : 'text-gray-400'
                        }`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Exchange Actions */}
                <div className="space-y-3">
                  {isConnected ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center py-2 px-4 bg-green-500/20 rounded-lg border border-green-500/30">
                        <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-sm text-green-400 font-medium">Connected</span>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="sm"
                        onClick={() => handleDisconnectExchange(exchange.value)}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Manage Connection
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="primary" 
                      className="w-full" 
                      onClick={() => handleConnectExchange(exchange)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Connect Exchange
                    </Button>
                  )}
                </div>

                {/* Hover overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Connection Modal */}
      <Modal
        isOpen={connectionModal.isOpen}
        onClose={() => setConnectionModal({ isOpen: false, exchange: null })}
        title={`Connect to ${connectionModal.exchange?.label}`}
        maxWidth="md"
      >
        <div className="space-y-6">
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-sm text-blue-300">
              To connect your exchange, you'll need to provide your API credentials. 
              Make sure your API key has trading permissions enabled.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="API Key"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              icon={<Key className="w-5 h-5 text-gray-400" />}
            />

            <div className="relative">
              <Input
                label="API Secret"
                type={showSecret ? "text" : "password"}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your API secret"
                icon={<Key className="w-5 h-5 text-gray-400" />}
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setConnectionModal({ isOpen: false, exchange: null })}
              disabled={connecting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleSubmitConnection}
              loading={connecting}
              disabled={!apiKey.trim() || !apiSecret.trim()}
            >
              {connecting ? 'Connecting...' : 'Connect Exchange'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};