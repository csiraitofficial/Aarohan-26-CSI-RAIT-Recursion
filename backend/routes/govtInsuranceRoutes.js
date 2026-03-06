import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import supabase from '../supabase.js';

const router = express.Router();

/**
 * @route   POST /api/govt-insurance/assess-eligibility
 * @desc    Assess user eligibility for government insurance schemes
 * @access  Private
 */
router.post('/assess-eligibility', authenticateUser, async (req, res) => {
    try {
        const {
            annual_income,
            occupation,
            employment_type,
            family_size,
            state,
            has_bpl_card,
            age
        } = req.body;

        const uid = req.user?.uid;
        if (!uid) return res.status(401).json({ error: 'User not authenticated' });

        // Fetch DB user ID from Supabase
        const { data: userRow, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('uid', uid)
            .single();

        if (userError || !userRow) {
            return res.status(404).json({ error: 'User not found in database' });
        }
        const userId = userRow.id;

        // 1. Fetch all active schemes and their criteria
        const { data: schemes, error: schemesError } = await supabase
            .from('government_schemes')
            .select('*, eligibility_criteria(*)')
            .eq('is_active', true);

        if (schemesError) throw schemesError;

        // 2. Eligibility Logic Engine
        const results = schemes.map(scheme => {
            let matchedCriteria = 0;
            const totalCriteria = scheme.eligibility_criteria.length;

            if (totalCriteria === 0) {
                return { ...scheme, eligibility_score: 100, is_eligible: true };
            }

            scheme.eligibility_criteria.forEach(criterion => {
                let isMatched = false;
                const userVal = {
                    income: annual_income,
                    occupation: occupation,
                    state: state,
                    age: age,
                    has_bpl_card: has_bpl_card
                }[criterion.criteria_type];

                if (userVal !== undefined) {
                    switch (criterion.operator) {
                        case '<=': isMatched = Number(userVal) <= Number(criterion.value); break;
                        case '>=': isMatched = Number(userVal) >= Number(criterion.value); break;
                        case '==': isMatched = String(userVal).toLowerCase() === String(criterion.value).toLowerCase(); break;
                        case 'includes': isMatched = String(criterion.value).toLowerCase().includes(String(userVal).toLowerCase()); break;
                        default: isMatched = false;
                    }
                }

                if (isMatched) matchedCriteria++;
            });

            const score = Math.round((matchedCriteria / totalCriteria) * 100);
            return {
                ...scheme,
                eligibility_score: score,
                is_eligible: score >= 80
            };
        });

        const eligibleSchemes = results.filter(r => r.is_eligible);
        const eligibleIds = eligibleSchemes.map(s => s.scheme_id);

        // 3. Save assessment to history
        const { error: saveError } = await supabase
            .from('user_assessments')
            .insert({
                user_id: userId,
                annual_income,
                occupation,
                employment_type,
                family_size,
                state,
                has_bpl_card,
                age,
                eligible_schemes: eligibleIds
            });

        if (saveError) console.error('Failed to save assessment history:', saveError);

        res.json({
            success: true,
            eligible_schemes: eligibleSchemes,
            all_results: results
        });

    } catch (error) {
        console.error('Error in GIP assessment:', error);
        res.status(500).json({ error: 'Failed to process eligibility assessment' });
    }
});

/**
 * @route   GET /api/govt-insurance/history
 * @desc    Get user's past eligibility assessments
 * @access  Private
 */
router.get('/history', authenticateUser, async (req, res) => {
    try {
        const uid = req.user?.uid;
        if (!uid) return res.status(401).json({ error: 'User not authenticated' });

        const { data: userRow, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('uid', uid)
            .single();

        if (userError || !userRow) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = userRow.id;

        const { data, error } = await supabase
            .from('user_assessments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        res.json({ success: true, history: data });
    } catch (error) {
        console.error('Error fetching GIP history:', error);
        res.status(500).json({ error: 'Failed to fetch assessment history' });
    }
});

/**
 * @route   GET /api/govt-insurance/schemes
 * @desc    Get all active government schemes
 * @access  Public
 */
router.get('/schemes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('government_schemes')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;
        res.json({ success: true, schemes: data });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch schemes' });
    }
});

export default router;
