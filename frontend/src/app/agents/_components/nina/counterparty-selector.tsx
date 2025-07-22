'use client';

import { useState } from 'react';
import { AgentLayout } from '../shared/agent-layout';
import { Search, Building2, Phone, Mail, Plus, Check } from 'lucide-react';

interface CounterpartySelectorProps {
  workflowId?: string;
  agentId: string;
}

export function CounterpartySelector({ workflowId, agentId }: CounterpartySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCounterparties, setSelectedCounterparties] = useState<string[]>([]);

  // Dummy counterparty data
  const counterparties = [
    {
      id: '1',
      name: 'Big Bank Mortgage',
      type: 'lender',
      email: 'payoffs@bigbank.com',
      phone: '1-800-555-1234',
      address: '123 Financial Ave, New York, NY 10001',
      status: 'active'
    },
    {
      id: '2',
      name: 'Greenwood HOA',
      type: 'hoa',
      email: 'manager@greenwoodhoa.com',
      phone: '555-987-6543',
      address: '456 Community Dr, Orlando, FL 32801',
      status: 'active'
    },
    {
      id: '3',
      name: 'Orange County Tax Collector',
      type: 'tax_authority',
      email: 'info@octaxcol.com',
      phone: '407-555-0123',
      address: '789 Government Blvd, Orlando, FL 32801',
      status: 'active'
    }
  ];

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'lender', label: 'Lenders' },
    { value: 'hoa', label: 'HOAs' },
    { value: 'municipality', label: 'Municipalities' },
    { value: 'tax_authority', label: 'Tax Authorities' },
    { value: 'utility', label: 'Utilities' }
  ];

  const filteredCounterparties = counterparties.filter(cp => {
    const matchesSearch = cp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || cp.type === selectedType;
    return matchesSearch && matchesType;
  });

  const toggleSelection = (id: string) => {
    setSelectedCounterparties(prev => 
      prev.includes(id) 
        ? prev.filter(cpId => cpId !== id)
        : [...prev, id]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lender': return '🏦';
      case 'hoa': return '🏘️';
      case 'tax_authority': return '🏛️';
      case 'municipality': return '🏢';
      case 'utility': return '⚡';
      default: return '🏢';
    }
  };

  const actions = (
    <div className="flex items-center gap-2">
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
        <Plus className="w-4 h-4" />
        Add New
      </button>
      {selectedCounterparties.length > 0 && (
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
          <Check className="w-4 h-4" />
          Add Selected ({selectedCounterparties.length})
        </button>
      )}
    </div>
  );

  return (
    <AgentLayout
      agentName="Nina"
      agentDescription="Counterparty Selection Agent"
      actions={actions}
    >
      <div className="p-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search counterparties..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {types.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {filteredCounterparties.length} counterparties found
            {selectedCounterparties.length > 0 && (
              <span className="ml-2 text-blue-600">
                • {selectedCounterparties.length} selected
              </span>
            )}
          </p>
        </div>

        {/* Counterparty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCounterparties.map((counterparty) => (
            <div
              key={counterparty.id}
              onClick={() => toggleSelection(counterparty.id)}
              className={`bg-white rounded-lg shadow-sm border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedCounterparties.includes(counterparty.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{getTypeIcon(counterparty.type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {counterparty.name}
                    </h3>
                    <span className="inline-block bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs capitalize">
                      {counterparty.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {selectedCounterparties.includes(counterparty.id) && (
                  <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{counterparty.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  <span>{counterparty.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span className="text-xs leading-tight">{counterparty.address}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                  counterparty.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {counterparty.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredCounterparties.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No counterparties found</p>
            <p className="text-sm text-gray-400">
              Try adjusting your search criteria or add a new counterparty
            </p>
          </div>
        )}
      </div>
    </AgentLayout>
  );
}