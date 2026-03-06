import supabase from './supabase.js';

async function testUsers() {
    console.log('Testing visibility of public.users...');
    try {
        const { data: dummy, error: dummyErr } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (dummyErr) {
            console.error('Users table error:', dummyErr);
        } else {
            console.log('Users table IS visible.');
        }

        const { data: dummy2, error: dummyErr2 } = await supabase
            .from('premium_predictions')
            .select('id')
            .limit(1);

        if (dummyErr2) {
            console.error('Predictions table error:', dummyErr2);
        } else {
            console.log('Predictions table IS visible.');
        }
    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

testUsers();
