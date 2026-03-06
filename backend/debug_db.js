import supabase from './supabase.js';

async function debug() {
    const uid = 'test-user'; // Or a real UID if known
    console.log('Debugging Supabase for UID:', uid);

    try {
        const { data: userRow, error: userErr } = await supabase
            .from('users')
            .select('id')
            .eq('uid', uid)
            .single();

        if (userErr) {
            console.error('User fetch error:', userErr);
        } else {
            console.log('User found:', userRow);

            const { data: history, error: histErr } = await supabase
                .from('premium_predictions')
                .select('*')
                .eq('user_id', userRow.id);

            if (histErr) {
                console.error('History fetch error:', histErr);
            } else {
                console.log('History fetch successful. Row count:', history.length);
            }
        }
    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

debug();
