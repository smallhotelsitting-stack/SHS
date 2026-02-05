import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

        // Client for user auth check
        const authClient = createClient(
            supabaseUrl,
            supabaseServiceKey,
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Get the session user
        const {
            data: { user },
            error: userError
        } = await authClient.auth.getUser()

        if (userError || !user) {
            throw new Error('User not authenticated')
        }

        // Check if user is admin
        const { data: profile, error: profileError } = await authClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || profile?.role !== 'admin') {
            return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const { subject, html, testMode } = await req.json()

        if (!subject || !html) {
            throw new Error('Missing subject or html body')
        }

        const adminClient = createClient(supabaseUrl, supabaseServiceKey)

        let recipients: { email: string }[] = []
        if (testMode) {
            recipients = [{ email: user.email! }]
        } else {
            const { data: profiles, error: fetchError } = await adminClient
                .from('profiles')
                .select('email')
                .not('email', 'is', null)

            if (fetchError) throw fetchError
            recipients = profiles as { email: string }[]
        }

        const resendApiKey = Deno.env.get('RESEND_API_KEY')
        if (!resendApiKey) {
            throw new Error('RESEND_API_KEY is not set')
        }

        // Using Resend API
        // Note: In production you might want to use Resend's batch sending API
        // or a queue system if the number of users is very large.
        let successCount = 0
        const errors = []

        for (const recipient of recipients) {
            try {
                const res = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${resendApiKey}`,
                    },
                    body: JSON.stringify({
                        from: 'Onboarding <onboarding@resend.dev>',
                        to: recipient.email,
                        subject: subject,
                        html: html,
                    }),
                })

                if (res.ok) {
                    successCount++
                } else {
                    const errorData = await res.json()
                    console.error('Resend API error:', errorData)
                    errors.push({ email: recipient.email, error: errorData })
                }
            } catch (e) {
                errors.push({ email: recipient.email, error: e.message })
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                count: successCount,
                total: recipients.length,
                testMode,
                errors: errors.length > 0 ? errors : undefined
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
