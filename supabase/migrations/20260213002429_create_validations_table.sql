/*
  # Create Validations System

  1. New Tables
    - `validations`
      - `id` (uuid, primary key) - Unique identifier for each validation
      - `input_type` (text) - Type of input: 'text', 'image', 'video', 'url'
      - `input_data` (text) - The actual input data or reference
      - `result` (text) - Validation result: 'authentic' or 'fake'
      - `confidence_score` (numeric) - ML model confidence score (0-100)
      - `details` (jsonb) - Additional analysis details
      - `created_at` (timestamptz) - Timestamp of validation request
      
  2. Security
    - Enable RLS on `validations` table
    - Add policy for anyone to insert validation requests
    - Add policy for anyone to read their validation results
    
  3. Indexes
    - Index on created_at for efficient time-based queries
    - Index on input_type for filtering by type
*/

CREATE TABLE IF NOT EXISTS validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_type text NOT NULL CHECK (input_type IN ('text', 'image', 'video', 'url')),
  input_data text NOT NULL,
  result text NOT NULL CHECK (result IN ('authentic', 'fake')),
  confidence_score numeric NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert validation requests"
  ON validations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can read validation results"
  ON validations FOR SELECT
  TO anon
  USING (true);

CREATE INDEX IF NOT EXISTS idx_validations_created_at ON validations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_validations_input_type ON validations(input_type);