import BottleDialog from '@/components/bottle-dialog';
import { Errors } from '@/components/cellar';
import RackGrid from '@/components/rack-grid';
import Pairing from '@/pages/pairing';
import WineForm from '@/pages/wines/form';
import type { Rack, Wine, WineScanResult } from '@/types/wine';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: () => null,
        Link: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
            <a href={href} {...props}>
                {children}
            </a>
        ),
        usePage: () => ({ url: '/wines/create', props: { auth: { user: { name: 'Test' } }, flash: {} } }),
    };
});
const wine: Wine = {
    id: 1,
    name: 'Barolo',
    producer: 'Test',
    vintage: 2020,
    type: 'red',
    country: 'Italien',
    region: null,
    ean: '8001234567897',
    systembolaget_number: '7424201',
    alcohol: 14,
    body: 'full',
    notes: null,
    label_url: null,
    grapes: [],
};
const rack: Rack = {
    id: 1,
    name: 'Källaren',
    description: null,
    rows: 2,
    columns: 2,
    bottles: [{ id: 1, wine_id: 1, wine_rack_id: 1, row: 1, column: 1, status: 'available', location: 'Källaren · A1', wine }],
};

describe('cellar interactions', () => {
    it('keeps saving available and sends no enhancement request on image selection', () => {
        const mock = vi.spyOn(globalThis, 'fetch');
        render(<WineForm wine={null} racks={[]} />);
        fireEvent.change(screen.getByLabelText('Flaskbild'), { target: { files: [new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })] } });
        expect(mock).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Spara vin och flaskor' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Läs etiketten' })).toBeEnabled();
        mock.mockRestore();
    });
    it('renders coordinates and distinguishes occupied empty and selected slots', () => {
        const select = vi.fn();
        render(<RackGrid rack={rack} onSelect={select} selected={[{ wine_rack_id: 1, row: 2, column: 2 }]} />);
        expect(screen.getByRole('button', { name: 'A1 Barolo' })).toBeVisible();
        fireEvent.click(screen.getByRole('button', { name: 'A2 Ledig' }));
        expect(select).toHaveBeenCalledWith({ wine_rack_id: 1, row: 1, column: 2 }, undefined);
        expect(screen.getByRole('button', { name: 'B2 Ledig' })).toHaveAttribute('aria-pressed', 'true');
    });
    it('opens bottle controls and requires confirmation for consumption', () => {
        render(<BottleDialog bottle={rack.bottles![0]} racks={[rack]} onClose={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: 'Markera konsumerad' }));
        expect(screen.getByText(/Markera flaskan som konsumerad/)).toBeVisible();
        expect(screen.getByRole('button', { name: 'Bekräfta' })).toBeVisible();
    });
    it('renders validation errors as an alert', () => {
        render(<Errors errors={{ position: 'Platsen är redan upptagen.' }} />);
        expect(screen.getByRole('alert')).toHaveTextContent('Platsen är redan upptagen.');
    });
    it('prefills a scanned label for review without saving the wine', async () => {
        const result: WineScanResult = {
            fields: {
                name: 'Chablis',
                producer: null,
                vintage: 2022,
                type: 'white',
                country: 'Frankrike',
                region: null,
                alcohol: null,
                body: null,
                grapes: [],
            },
            confidence: { name: 'high' },
            warnings: ['Kontrollera årgången.'],
        };
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => result } as Response);
        render(<WineForm wine={null} racks={[]} />);
        fireEvent.change(screen.getByLabelText('Flaskbild'), { target: { files: [new File(['photo'], 'label.jpg', { type: 'image/jpeg' })] } });
        fireEvent.click(screen.getByRole('button', { name: 'Läs etiketten' }));
        await waitFor(() => expect(screen.getByLabelText('Vinets namn *')).toHaveValue('Chablis'));
        expect(screen.getByText('Granska uppgifterna före sparning')).toBeVisible();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        fetchMock.mockRestore();
    });
    it('shows a useful scan failure while leaving manual fields editable', async () => {
        const mock = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue({ ok: false, json: async () => ({ message: 'Analysen tog för lång tid.' }) } as Response);
        render(<WineForm wine={null} racks={[]} />);
        fireEvent.change(screen.getByLabelText('Flaskbild'), { target: { files: [new File(['photo'], 'label.jpg', { type: 'image/jpeg' })] } });
        fireEvent.click(screen.getByRole('button', { name: 'Läs etiketten' }));
        await waitFor(() =>
            expect(screen.getAllByRole('alert').some((alert) => alert.textContent?.includes('Analysen tog för lång tid.'))).toBe(true),
        );
        fireEvent.change(screen.getByLabelText('Vinets namn *'), { target: { value: 'Manuellt vin' } });
        expect(screen.getByLabelText('Vinets namn *')).toHaveValue('Manuellt vin');
        mock.mockRestore();
    });
    it('shows a recommendation and a link to the exact bottle location', async () => {
        const mock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                recommendations: [{ wine: { ...wine, bottles: rack.bottles }, rank: 1, reason: 'Passar svampen.' }],
                message: 'Ett förslag.',
            }),
        } as Response);
        render(<Pairing />);
        fireEvent.change(screen.getByLabelText('Vad blir det till middag?'), { target: { value: 'Svamprisotto' } });
        fireEvent.click(screen.getByRole('button', { name: 'Hitta passande vin' }));
        await waitFor(() => expect(screen.getByText('Passar svampen.')).toBeVisible());
        expect(screen.getByRole('link', { name: /Källaren · A1/ })).toHaveAttribute('href', '/racks/1?bottle=1');
        mock.mockRestore();
    });
});
