import { describe, it, expect } from 'vitest';
import { generateMarkdownDossier, generatePrintHtml } from '../services/dossierExport';
import { INITIAL_DEMO_CASES } from '../data/demoCases';

describe('dossierExport service', () => {
  it('generates complete markdown work order with all required sections', () => {
    const testCase = INITIAL_DEMO_CASES[0];
    const md = generateMarkdownDossier(testCase);

    expect(md).toContain(`# [WORK ORDER] ${testCase.id}`);
    expect(md).toContain(`**Case ID** | \`${testCase.id}\``);
    expect(md).toContain(`**Status** | **${testCase.status}**`);
    expect(md).toContain(`**Category** | ${testCase.category}`);
    expect(md).toContain(`## 1. Consolidated Incident Evidence`);
    expect(md).toContain(`## 2. Multimodal AI Analysis`);
    expect(md).toContain(`Epistemic Uncertainty & Inspection Limits`);
    expect(md).toContain(`Non-binding SLA`);
  });

  it('generates official municipal work order HTML with printable markup and signatures', () => {
    const testCase = INITIAL_DEMO_CASES[0];
    const html = generatePrintHtml(testCase);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Municipal Work Order');
    expect(html).toContain(testCase.id);
    expect(html).toContain(testCase.title);
    expect(html).toContain(testCase.category);
    expect(html).toContain('Field Inspector Signature');
    expect(html).toContain('Municipal Supervisor Authorization');
    expect(html).toContain('@media print');
  });
});
