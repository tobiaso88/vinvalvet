import BottleDialog from '@/components/bottle-dialog';
import BottleFinancials from '@/components/bottle-financials';
import { Errors } from '@/components/cellar';
import RackGrid from '@/components/rack-grid';
import WineResearchCard from '@/components/wine-research';
import Pairing from '@/pages/pairing';
import WineForm from '@/pages/wines/form';
import type { Rack, Wine, WineScanResult } from '@/types/wine';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

const poll = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn() }));

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
        usePoll: () => poll,
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
    bottles: [
        {
            id: 1,
            wine_id: 1,
            wine_rack_id: 1,
            row: 1,
            column: 1,
            status: 'available',
            location: 'Källaren · A1',
            purchase_price: null,
            estimated_value: null,
            wine,
        },
    ],
};

describe('cellar interactions', () => {
    it('polls while wine research is active', () => {
        poll.start.mockClear();
        render(
            <WineResearchCard
                wine={{
                    ...wine,
                    research: {
                        id: 1,
                        status: 'processing',
                        suggestions: null,
                        ratings: null,
                        sources: null,
                        warnings: null,
                        applied_fields: [],
                        error_message: null,
                        researched_at: null,
                        reviewed_at: null,
                    },
                }}
            />,
        );
        expect(screen.getByText('Söker och kontrollerar källor …')).toBeVisible();
        expect(poll.start).toHaveBeenCalled();
    });
    it('shows selectable sourced suggestions and verified ratings', () => {
        render(
            <WineResearchCard
                wine={{
                    ...wine,
                    producer: null,
                    research: {
                        id: 2,
                        status: 'completed',
                        suggestions: {
                            fields: { producer: 'Ny producent' },
                            confidence: { producer: 'high' },
                            source_urls: { producer: ['https://producer.example/wine'] },
                        },
                        ratings: [
                            {
                                provider: 'Vivino',
                                score: 4.2,
                                scale: 5,
                                review_count: 120,
                                vintage: 2020,
                                url: 'https://vivino.example/wine',
                                observed_at: '2026-09-14T10:00:00Z',
                            },
                        ],
                        sources: [{ title: 'Producentens vinsida', url: 'https://producer.example/wine' }],
                        warnings: [],
                        applied_fields: [],
                        error_message: null,
                        researched_at: '2026-09-14T10:00:00Z',
                        reviewed_at: null,
                    },
                }}
            />,
        );
        expect(screen.getByText('Ny producent')).toBeVisible();
        expect(screen.getByRole('checkbox')).toBeChecked();
        expect(screen.getByRole('link', { name: /Vivino/ })).toHaveAttribute('rel', 'noopener noreferrer');
        expect(screen.getByRole('link', { name: /Producentens vinsida/ })).toHaveAttribute('target', '_blank');
        expect(screen.getByRole('button', { name: /Godkänn valda uppgifter/ })).toBeEnabled();
    });
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
    it('shows a sourced bottle valuation and saves a purchase price separately', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ purchase_price: 299 }) } as Response);
        render(
            <BottleFinancials
                bottle={{
                    ...rack.bottles![0],
                    valuation: {
                        id: 1,
                        status: 'completed',
                        estimated_value: 875,
                        currency: 'SEK',
                        basis: 'Aktuellt marknadspris.',
                        sources: [{ title: 'Handlare', url: 'https://merchant.example/wine' }],
                        warnings: [],
                        error_message: null,
                        valued_at: '2026-09-14T10:00:00Z',
                        reviewed_at: null,
                    },
                }}
            />,
        );
        expect(screen.getByText(/875/)).toBeVisible();
        expect(screen.getByRole('link', { name: /Handlare/ })).toHaveAttribute('rel', 'noopener noreferrer');
        fireEvent.change(screen.getByLabelText('Inköpspris'), { target: { value: '299' } });
        fireEvent.click(screen.getByRole('button', { name: 'Spara inköpspris' }));
        await waitFor(() => expect(screen.getByText('Inköpspriset har sparats.')).toBeVisible());
        expect(fetchMock).toHaveBeenCalledWith('/bottles/1/financials', expect.objectContaining({ method: 'PATCH' }));
        fetchMock.mockRestore();
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
