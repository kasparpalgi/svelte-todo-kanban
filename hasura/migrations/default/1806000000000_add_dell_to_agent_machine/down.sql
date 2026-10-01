UPDATE public.todos SET agent_machine = NULL WHERE agent_machine = 'dell';
ALTER TABLE public.todos
  DROP CONSTRAINT IF EXISTS todos_agent_machine_check,
  ADD CONSTRAINT todos_agent_machine_check CHECK (
    agent_machine IS NULL OR agent_machine IN ('mac', 'karel')
  );
