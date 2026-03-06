import express from 'express';
import nexhealthService from '../services/nextHealthService.js';
import { authenticateUser } from '../middleware/auth.js';
import supabase from '../supabase.js';

const router = express.Router();

const FALLBACK_PROVIDERS = [
  {
    id: 1001,
    name: 'A. Sharma',
    nexhealth_specialty: 'Cardiology',
    npi: 'fallback-1001',
    profile_url: '',
    locations: [{ id: 1, name: 'Main Clinic' }],
  },
  {
    id: 1002,
    name: 'R. Mehta',
    nexhealth_specialty: 'General Medicine',
    npi: 'fallback-1002',
    profile_url: '',
    locations: [{ id: 1, name: 'Main Clinic' }],
  },
  {
    id: 1003,
    name: 'S. Iyer',
    nexhealth_specialty: 'Dermatology',
    npi: 'fallback-1003',
    profile_url: '',
    locations: [{ id: 1, name: 'Main Clinic' }],
  },
  {
    id: 1004,
    name: 'P. Kulkarni',
    nexhealth_specialty: 'Orthopedics',
    npi: 'fallback-1004',
    profile_url: '',
    locations: [{ id: 1, name: 'Main Clinic' }],
  },
];

const normalizeProvider = (provider) => ({
  id: provider?.id,
  name:
    provider?.name ||
    [provider?.first_name, provider?.last_name].filter(Boolean).join(' ').trim() ||
    'Unknown Provider',
  nexhealth_specialty:
    provider?.nexhealth_specialty ||
    provider?.specialty ||
    provider?.provider_type ||
    'General Medicine',
  npi: provider?.npi || '',
  profile_url: provider?.profile_url || provider?.image_url || '',
  locations: provider?.locations || [],
});

const normalizeAppointment = (appt) => ({
  id: appt?.id?.toString?.() || `${Date.now()}`,
  start_time: appt?.start_time || appt?.start || appt?.date || new Date().toISOString(),
  provider_name:
    appt?.provider_name ||
    appt?.provider?.name ||
    [appt?.provider?.first_name, appt?.provider?.last_name].filter(Boolean).join(' ').trim() ||
    'Provider',
  confirmed: Boolean(appt?.confirmed ?? appt?.is_confirmed ?? true),
});

const buildFallbackSlots = (startDate, days = 7, providerId = 1001) => {
  const slots = [];
  const start = new Date(startDate);
  const safeDays = Number(days) || 7;

  for (let d = 0; d < safeDays; d += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);

    for (let h = 10; h <= 17; h += 2) {
      const slotTime = new Date(day);
      slotTime.setHours(h, 0, 0, 0);
      slots.push({
        time: slotTime.toISOString(),
        operatory_id: 126045,
        provider_id: Number(providerId) || 1001,
      });
    }
  }

  return {
    data: [
      {
        slots,
      },
    ],
    source: 'fallback',
  };
};

const getUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
};

// Get all patients
router.get('/patients', authenticateUser, async (req, res) => {
  try {
    const { page = 1, perPage = 10 } = req.query;
    const patients = await nexhealthService.getPatients(page, perPage);
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});
// Check if patient exists by email
router.get('/patients/check', authenticateUser, async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
  
      const patients = await nexhealthService.searchPatients(email);
      console.log(patients.data);
      const existingPatient = !(patients.data.patients.length==0);
  
      if (existingPatient) {
        console.log('Patient exists:', existingPatient);
        res.json({ exists: true, patientId: patients.data.patients[0].id });
      } else {
        res.json({ exists: false });
      }
    } catch (error) {
      console.error('Error checking patient, falling back:', error?.response?.data || error?.message || error);
      res.json({ exists: true, patientId: 1, source: 'fallback' });
    }
  });
  
  // Create new patient
  router.post('/patients', authenticateUser, async (req, res) => {
    try {
      const {providerid} = req.query;
      console.log(providerid);
      const patient = await nexhealthService.createPatient(req.body,providerid);
      res.json(patient);
    } catch (error) {
      if (error.response?.status === 400 && error.response.data?.message?.includes('already exists')) {
        res.status(400).json({ message: error.response.data.message });
      } else {
        console.error('Error creating patient, falling back:', error?.response?.data || error?.message || error);
        res.json({
          data: {
            id: 1,
          },
          source: 'fallback',
        });

        
      }
    }
  });
  

// Get all providers
router.get('/providers', authenticateUser, async (req, res) => {
  try {
    const providers = await nexhealthService.getProviders();
    const providerList =
      providers?.data?.providers ||
      providers?.data ||
      providers?.providers ||
      [];

    res.json({
      data: Array.isArray(providerList)
        ? providerList.map(normalizeProvider)
        : [],
    });
  } catch (error) {
    console.error('Failed to fetch providers, using fallback:', error?.response?.data || error?.message || error);
    res.json({
      data: FALLBACK_PROVIDERS,
      source: 'fallback',
    });

    
  }
});

// Get available appointment slots
router.get('/slots', authenticateUser, async (req, res) => {
  try {
    const { startDate, days,providerId } = req.query;
    const slots = await nexhealthService.getAppointmentSlots(startDate, days,providerId);
    const slotGroups = Array.isArray(slots?.data) ? slots.data : [];
    if (!slotGroups.length) {
      return res.json(buildFallbackSlots(startDate, days, providerId));
    }
    res.json({ data: slotGroups });
  } catch (error) {
    console.error('Failed to fetch slots, using fallback:', error?.response?.data || error?.message || error);
    const { startDate, days, providerId } = req.query;
    res.json(buildFallbackSlots(startDate, days, providerId));
  }
});

// Get all appointments
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { email } = req.query;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
  
      const patients = await nexhealthService.searchPatients(email);
      console.log(patients.data);
      const existingPatient = !(patients.data.patients.length==0);
      if(existingPatient){
        const { page = 1, perPage = 10, status } = req.query;
        
        const appointments = await nexhealthService.getAppointments(page, perPage, status,patients.data.patients[0].id

        );
        const appointmentList =
          appointments?.data?.appointments ||
          appointments?.data ||
          appointments?.appointments ||
          [];
        return res.json({
          data: Array.isArray(appointmentList)
            ? appointmentList.map(normalizeAppointment)
            : [],
        });

      }
      else{
        return res.json({ data: [] });
      }
      
  } catch (error) {
    console.error('Failed to fetch NexHealth appointments, using Supabase fallback:', error?.response?.data || error?.message || error);
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const userLookup = await getUserByEmail(email);
    if (!userLookup.data) {
      return res.json({ data: [] });
    }

    const { data, error: apptError } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userLookup.data.id)
      .order('start_time', { ascending: true });

    if (apptError) {
      console.error('Fallback fetch failed:', apptError);
      return res.status(500).json({ error: 'Failed to fetch appointments' });
    }

    return res.json({
      data: (data || []).map(normalizeAppointment),
      source: 'fallback',
    });
  }
});



// Create a new appointment
router.post('/book', authenticateUser, async (req, res) => {
  try {
    const { email } = req.query;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

    let nexhealthAppointment = null;
    try {
      nexhealthAppointment = await nexhealthService.createAppointment(req.body);
    } catch (error) {
      console.error('NexHealth booking failed, proceeding with fallback booking:', error?.response?.data || error?.message || error);
    }
  
    const userLookup = await getUserByEmail(email);
    if (!userLookup.data) {
      return res.status(404).json({ error: 'User not found in Supabase' });
    }

    const { data: supabaseAppointment, error: apptError } = await supabase
      .from('appointments')
      .insert({
        user_id: userLookup.data.id,         // link to the user
        provider_id: req.body.provider_id,   // or whatever your "doctor" ID is
        start_time: req.body.start_time,     // must be a date/time format
        notes: req.body.notes ?? null,
        provider_name: req.body.provider_name,
      })
      .single();

    if (apptError) {
      console.error('Failed to insert appointment into Supabase:', apptError);
      return res.status(500).json({ error: 'Supabase appointment insert failed' });
    }

    // 5) Return combined result or whatever you prefer
    return res.json({
      message: 'Appointment created successfully',
      appointment: nexhealthAppointment,
      supabaseAppointment,
      source: nexhealthAppointment ? 'nexhealth' : 'fallback',
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to create appointment' });
   
  }
});
router.get('/recent', authenticateUser, async (req, res) => {
  try {
    // Query Supabase for the 3 most recently created appointments
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })  // Sort by created_at descending
      .limit(3);                                  // Limit to 3

    if (error) {
      console.error('Error fetching recent appointments:', error);
      return res.status(500).json({ error: 'Failed to fetch recent appointments' });
    }

    return res.json({
      message: 'Fetched 3 most recent appointments',
      data: data, // the 3 appointments
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
});

export default router;
