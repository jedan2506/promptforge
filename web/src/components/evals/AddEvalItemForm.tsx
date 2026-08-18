'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { createEvalItem } from '@/services/evalService';
import type { Grader } from '@/types/api';

interface Props {
  projectSlug: string;
  promptSlug: string;
  setSlug: string;
}

const GRADER_HINT: Record<Grader, string> = {
  exact: 'Model output must equal expected string exactly.',
  substring: 'Expected string must appear anywhere in model output.',
  regex: 'Model output must match the expected pattern (JS regex, no delimiters).',
  'llm-judge': 'A second LLM call decides PASS/FAIL using the judge prompt.',
};

export function AddEvalItemForm({ projectSlug, promptSlug, setSlug }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [vars, setVars] = useState('{\n  "question": "Do you refund shipping?"\n}');
  const [grader, setGrader] = useState<Grader>('substring');
  const [expected, setExpected] = useState('');
  const [judgePrompt, setJudgePrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim() || submitting) return;
    let inputVarsJson: Record<string, string> = {};
    if (vars.trim()) {
      try {
        const parsed = JSON.parse(vars);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          inputVarsJson = Object.fromEntries(
            Object.entries(parsed).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]),
          );
        } else {
          setError('Input vars must be a JSON object of string values.');
          return;
        }
      } catch (err) {
        setError(`Input vars must be valid JSON: ${err instanceof Error ? err.message : 'parse error'}`);
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    const payload = {
      name: name.trim(),
      inputVarsJson,
      grader,
      expected: expected.trim() || undefined,
      judgePrompt: grader === 'llm-judge' ? judgePrompt.trim() || undefined : undefined,
    };
    const result = await createEvalItem(projectSlug, promptSlug, setSlug, payload);
    setSubmitting(false);
    if (!result?.success) {
      setError(result?.error?.message ?? 'unknown error');
      return;
    }
    setName('');
    setExpected('');
    setJudgePrompt('');
    router.refresh();
  }

  return (
    <Card>
      <div className="text-sm font-semibold mb-1">Add item</div>
      <p className="text-[11px] text-fg-muted mb-4">
        Each item is a single test case. Input vars are substituted into the prompt template via {'{{var}}'}.
      </p>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Label required>
            Name
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="refund shipping question"
              maxLength={120}
            />
          </Label>
          <Label required hint={GRADER_HINT[grader]}>
            Grader
            <Select value={grader} onChange={(e) => setGrader(e.target.value as Grader)}>
              <option value="exact">exact</option>
              <option value="substring">substring</option>
              <option value="regex">regex</option>
              <option value="llm-judge">llm-judge</option>
            </Select>
          </Label>
        </div>
        <Label hint="JSON object. Keys become {{var}} placeholders in the user template.">
          Input vars
          <Textarea value={vars} onChange={(e) => setVars(e.target.value)} rows={4} />
        </Label>
        {grader !== 'llm-judge' && (
          <Label hint={grader === 'regex' ? 'Pattern only. e.g. shipping\\s+refund' : 'Text to match.'}>
            Expected
            <Textarea
              value={expected}
              onChange={(e) => setExpected(e.target.value)}
              rows={2}
              placeholder={grader === 'regex' ? 'refund.*shipping' : 'We refund shipping on orders over $50.'}
            />
          </Label>
        )}
        {grader === 'llm-judge' && (
          <Label hint="Judge model must reply exactly 'PASS: reason' or 'FAIL: reason'.">
            Judge prompt
            <Textarea
              value={judgePrompt}
              onChange={(e) => setJudgePrompt(e.target.value)}
              rows={3}
              placeholder={
                'Given the assistant reply below, decide whether it correctly and politely explains the shipping refund policy.\n\nReply exactly "PASS: <reason>" or "FAIL: <reason>".'
              }
            />
          </Label>
        )}
        {error && (
          <Alert variant="danger" title="Couldn't add item">
            {error}
          </Alert>
        )}
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Add item
          </Button>
        </div>
      </div>
    </Card>
  );
}
