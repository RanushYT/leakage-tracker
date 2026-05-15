-- Create transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Storing WhatsApp Phone Number here for the MVP
    item TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'LKR',
    category TEXT NOT NULL,
    necessity_score INTEGER NOT NULL,
    is_unnecessary BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for anon key for MVP purposes
-- In a production environment, you would restrict this to authenticated users
CREATE POLICY "Allow anon all access" 
ON public.transactions 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);
