import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import supabase from '../supabase.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// Helper: get doctor by Firebase UID
// ─────────────────────────────────────────────────────────────────────────────
const getDoctorByUid = async (uid) => {
    const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('uid', uid)
        .single();
    return { data, error };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctor/profile — get doctor profile
// ─────────────────────────────────────────────────────────────────────────────
router.get('/profile', authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        const { data, error } = await getDoctorByUid(uid);
        if (error || !data) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        res.json({ doctor: data });
    } catch (err) {
        console.error('Error fetching doctor profile:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctor/appointments — list doctor's appointments
// ─────────────────────────────────────────────────────────────────────────────
router.get('/appointments', authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        const { data: doctor, error: docError } = await getDoctorByUid(uid);
        if (docError || !doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('doctor_id', doctor.id)
            .order('start_time', { ascending: true });

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch appointments' });
        }

        res.json({ appointments: data || [] });
    } catch (err) {
        console.error('Error fetching doctor appointments:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/doctor/appointments/:id/cancel — cancel an appointment
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/appointments/:id/cancel', authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;
        const { data: doctor, error: docError } = await getDoctorByUid(uid);
        if (docError || !doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        const { data, error } = await supabase
            .from('appointments')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('doctor_id', doctor.id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to cancel appointment' });
        }

        res.json({ message: 'Appointment cancelled', appointment: data });
    } catch (err) {
        console.error('Error cancelling appointment:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/doctor/appointments/:id/complete — mark appointment complete
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/appointments/:id/complete', authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;
        const { data: doctor, error: docError } = await getDoctorByUid(uid);
        if (docError || !doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        const { data, error } = await supabase
            .from('appointments')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('doctor_id', doctor.id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to complete appointment' });
        }

        res.json({ message: 'Appointment completed', appointment: data });
    } catch (err) {
        console.error('Error completing appointment:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/doctor/appointments/:id/note — send a note
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/appointments/:id/note', authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        const { id } = req.params;
        const { note } = req.body;
        const { data: doctor, error: docError } = await getDoctorByUid(uid);
        if (docError || !doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        if (!note) {
            return res.status(400).json({ error: 'Note is required' });
        }

        const { data, error } = await supabase
            .from('appointments')
            .update({ doctor_note: note, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('doctor_id', doctor.id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to send note' });
        }

        res.json({ message: 'Note sent', appointment: data });
    } catch (err) {
        console.error('Error sending note:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctor/availability — get doctor's availability
// ─────────────────────────────────────────────────────────────────────────────
router.get('/availability', authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        const { data: doctor, error: docError } = await getDoctorByUid(uid);
        if (docError || !doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        const { data, error } = await supabase
            .from('doctor_availability')
            .select('*')
            .eq('doctor_id', doctor.id)
            .order('day_of_week', { ascending: true });

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch availability' });
        }

        res.json({ availability: data || [] });
    } catch (err) {
        console.error('Error fetching availability:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/doctor/availability — set availability (upsert)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/availability', authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        const { slots } = req.body; // Array of { day_of_week, start_time, end_time, is_active }

        const { data: doctor, error: docError } = await getDoctorByUid(uid);
        if (docError || !doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        if (!slots || !Array.isArray(slots)) {
            return res.status(400).json({ error: 'slots array is required' });
        }

        // Delete existing availability and replace
        await supabase
            .from('doctor_availability')
            .delete()
            .eq('doctor_id', doctor.id);

        const slotsWithDoctorId = slots.map((slot) => ({
            doctor_id: doctor.id,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_active: slot.is_active !== undefined ? slot.is_active : true,
        }));

        const { data, error } = await supabase
            .from('doctor_availability')
            .insert(slotsWithDoctorId)
            .select();

        if (error) {
            return res.status(500).json({ error: 'Failed to save availability' });
        }

        res.json({ message: 'Availability saved', availability: data });
    } catch (err) {
        console.error('Error saving availability:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctors/registered — list all registered doctors (public for matching)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/registered', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('doctors')
            .select('id, name, specialty, clinic_name, clinic_address, phone');

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch registered doctors' });
        }

        res.json({ doctors: data || [] });
    } catch (err) {
        console.error('Error fetching registered doctors:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/doctors/:doctorId/slots — get available booking slots for a date
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:doctorId/slots', authenticateUser, async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date } = req.query; // YYYY-MM-DD

        if (!date) {
            return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
        }

        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay(); // 0=Sunday, 6=Saturday

        // Get doctor availability for this day
        const { data: availability, error: availError } = await supabase
            .from('doctor_availability')
            .select('*')
            .eq('doctor_id', doctorId)
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true);

        if (availError) {
            return res.status(500).json({ error: 'Failed to fetch availability' });
        }

        if (!availability || availability.length === 0) {
            return res.json({ slots: [], message: 'No availability for this day' });
        }

        // Get existing appointments for this doctor on this date
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;

        const { data: existingAppts, error: apptError } = await supabase
            .from('appointments')
            .select('start_time')
            .eq('doctor_id', doctorId)
            .neq('status', 'cancelled')
            .gte('start_time', startOfDay)
            .lte('start_time', endOfDay);

        if (apptError) {
            console.error('Error fetching existing appointments:', apptError);
        }

        const bookedTimes = new Set(
            (existingAppts || []).map((a) => {
                const d = new Date(a.start_time);
                return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            })
        );

        // Generate 30-minute slots from availability
        const slots = [];
        for (const avail of availability) {
            const [startH, startM] = avail.start_time.split(':').map(Number);
            const [endH, endM] = avail.end_time.split(':').map(Number);

            let currentH = startH;
            let currentM = startM;

            while (currentH < endH || (currentH === endH && currentM < endM)) {
                const timeStr = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
                const slotDateTime = `${date}T${timeStr}:00`;

                slots.push({
                    time: slotDateTime,
                    display_time: timeStr,
                    available: !bookedTimes.has(timeStr),
                });

                // Advance by 30 minutes
                currentM += 30;
                if (currentM >= 60) {
                    currentH += 1;
                    currentM -= 60;
                }
            }
        }

        res.json({ slots, doctor_id: parseInt(doctorId) });
    } catch (err) {
        console.error('Error fetching slots:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/doctors/book — book appointment with a registered doctor
// ─────────────────────────────────────────────────────────────────────────────
router.post('/book', authenticateUser, async (req, res) => {
    try {
        const { uid } = req.user;
        const { doctor_id, start_time, title, description } = req.body;

        if (!doctor_id || !start_time) {
            return res.status(400).json({ error: 'doctor_id and start_time are required' });
        }

        // Get user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('uid', uid)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get doctor
        const { data: doctor, error: docError } = await supabase
            .from('doctors')
            .select('id, name')
            .eq('id', doctor_id)
            .single();

        if (docError || !doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Create appointment
        const { data, error } = await supabase
            .from('appointments')
            .insert({
                user_id: user.id,
                doctor_id: doctor.id,
                start_time,
                title: title || `Appointment with Dr. ${doctor.name}`,
                description: description || '',
                status: 'scheduled',
                patient_name: user.name,
                patient_email: user.email,
            })
            .select()
            .single();

        if (error) {
            console.error('Error booking appointment:', error);
            return res.status(500).json({ error: 'Failed to book appointment' });
        }

        res.status(201).json({ message: 'Appointment booked successfully', appointment: data });
    } catch (err) {
        console.error('Error booking appointment:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
