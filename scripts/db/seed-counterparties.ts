#!/usr/bin/env tsx

/**
 * Seed Counterparties Script
 * Creates sample counterparty data for testing the counterparty management system
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../supabase/types';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

interface CounterpartyData {
  name: string;
  type: 'hoa' | 'lender' | 'municipality' | 'utility' | 'tax_authority';
  email?: string;
  phone?: string;
  address?: string;
  contact_info?: any;
}

const counterpartyData: CounterpartyData[] = [
  // HOAs
  {
    name: 'Sunset Hills HOA',
    type: 'hoa',
    email: 'contact@sunsethills.com',
    phone: '(555) 123-4567',
    address: '123 Sunset Drive, Beverly Hills, CA 90210',
    contact_info: {
      management_company: 'Premium Property Management',
      office_hours: 'Mon-Fri 9AM-5PM',
      emergency_contact: '(555) 123-4568'
    }
  },
  {
    name: 'Oceanview Estates HOA',
    type: 'hoa',
    email: 'admin@oceanviewestates.org',
    phone: '(555) 234-5678',
    address: '456 Ocean View Blvd, Malibu, CA 90265',
    contact_info: {
      management_company: 'Coastal HOA Services',
      website: 'www.oceanviewestates.org'
    }
  },
  {
    name: 'Pine Valley Community Association',
    type: 'hoa',
    email: 'office@pinevalley.com',
    phone: '(555) 345-6789',
    address: '789 Pine Valley Road, Pasadena, CA 91101'
  },

  // Lenders
  {
    name: 'First National Bank',
    type: 'lender',
    email: 'payoffs@firstnational.com',
    phone: '(555) 456-7890',
    address: '100 Financial Plaza, Los Angeles, CA 90071',
    contact_info: {
      department: 'Loan Servicing',
      fax: '(555) 456-7891',
      processing_time: '3-5 business days'
    }
  },
  {
    name: 'California Credit Union',
    type: 'lender',
    email: 'loanservicing@calcreditunion.org',
    phone: '(555) 567-8901',
    address: '200 Credit Union Way, San Diego, CA 92101',
    contact_info: {
      member_services: '(555) 567-8902',
      hours: 'Mon-Fri 8AM-6PM, Sat 9AM-2PM'
    }
  },
  {
    name: 'Pacific Mortgage Services',
    type: 'lender',
    email: 'payoffs@pacificmortgage.com',
    phone: '(555) 678-9012',
    address: '300 Pacific Coast Hwy, Santa Monica, CA 90405'
  },

  // Municipalities  
  {
    name: 'City of Los Angeles',
    type: 'municipality',
    email: 'liens@lacity.org',
    phone: '(213) 555-0123',
    address: '200 N Spring St, Los Angeles, CA 90012',
    contact_info: {
      department: 'Revenue and Recovery Division',
      website: 'www.lacity.org',
      business_hours: 'Mon-Fri 8AM-5PM'
    }
  },
  {
    name: 'City of Beverly Hills',
    type: 'municipality',
    email: 'finance@beverlyhills.org',
    phone: '(310) 555-0234',
    address: '455 N Rexford Dr, Beverly Hills, CA 90210',
    contact_info: {
      department: 'Finance Department',
      lien_contact: 'John Smith'
    }
  },
  {
    name: 'County of Orange',
    type: 'municipality',
    email: 'liens@ocgov.com',
    phone: '(714) 555-0345',
    address: '10 Civic Center Plaza, Santa Ana, CA 92701'
  },

  // Tax Authorities
  {
    name: 'Los Angeles County Tax Collector',
    type: 'tax_authority',
    email: 'taxinfo@lacounty.gov',
    phone: '(213) 555-0456',
    address: '500 W Temple St, Los Angeles, CA 90012',
    contact_info: {
      department: 'Property Tax Division',
      online_portal: 'www.lacountypropertytax.com',
      payment_hours: '24/7 online, office Mon-Fri 8AM-5PM'
    }
  },
  {
    name: 'Orange County Tax Collector',
    type: 'tax_authority',
    email: 'propertytax@octax.com',
    phone: '(714) 555-0567',
    address: '12 Civic Center Plaza, Santa Ana, CA 92701'
  },
  {
    name: 'Riverside County Tax Collector',
    type: 'tax_authority',
    email: 'taxes@rivco.org',
    phone: '(951) 555-0678',
    address: '4080 Lemon St, Riverside, CA 92501'
  },

  // Utilities
  {
    name: 'Los Angeles Department of Water and Power',
    type: 'utility',
    email: 'liens@ladwp.com',
    phone: '(800) 555-0789',
    address: '111 N Hope St, Los Angeles, CA 90012',
    contact_info: {
      service_type: 'Water and Electric',
      emergency: '(800) 555-0790',
      website: 'www.ladwp.com'
    }
  },
  {
    name: 'Southern California Edison',
    type: 'utility',
    email: 'businessservices@sce.com',
    phone: '(800) 555-0890',
    address: '2244 Walnut Grove Ave, Rosemead, CA 91770',
    contact_info: {
      service_type: 'Electric',
      business_hours: 'Mon-Fri 7AM-7PM'
    }
  },
  {
    name: 'SoCalGas',
    type: 'utility',
    email: 'customerservice@socalgas.com',
    phone: '(800) 555-0901',
    address: '555 W 5th St, Los Angeles, CA 90013',
    contact_info: {
      service_type: 'Natural Gas',
      emergency_line: '(800) 555-0902'
    }
  },
  {
    name: 'San Diego Gas & Electric',
    type: 'utility',
    email: 'business@sdge.com',
    phone: '(800) 555-1012',
    address: '8330 Century Park Ct, San Diego, CA 92123'
  }
];

async function seedCounterparties() {
  console.log('🌱 Starting counterparty seeding...');
  
  try {
    // Insert counterparties
    const { data, error } = await supabase
      .from('counterparties')
      .insert(counterpartyData)
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ Successfully seeded ${data.length} counterparties:`);
    
    // Group by type for summary
    const summary = data.reduce((acc: Record<string, number>, cp) => {
      acc[cp.type] = (acc[cp.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(summary).forEach(([type, count]) => {
      console.log(`   - ${count} ${type} counterparties`);
    });

    console.log('\n📋 Sample counterparties created:');
    data.forEach((cp, index) => {
      if (index < 5) { // Show first 5 as examples
        console.log(`   - ${cp.name} (${cp.type}) - ${cp.email || 'No email'}`);
      }
    });
    
    if (data.length > 5) {
      console.log(`   ... and ${data.length - 5} more`);
    }

  } catch (error) {
    console.error('❌ Error seeding counterparties:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedCounterparties();
    console.log('\n🎉 Counterparty seeding completed successfully!');
  } catch (error) {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { seedCounterparties };