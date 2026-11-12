import BottleDialog from '@/components/bottle-dialog';
import BottleFinancials from '@/components/bottle-financials';
import { Errors } from '@/components/cellar';
import NavigationLoadingIndicator from '@/components/navigation-loading-indicator';
import RackGrid from '@/components/rack-grid';
import WineFinancials from '@/components/wine-financials';
import WineResearchCard from '@/components/wine-research';
import { jsonRequest } from '@/lib/json-request';
import Dashboard from '@/pages/dashboard';
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
        Link: ({ children, href, prefetch: _prefetch, ...props }: { children: ReactNode; href: string; prefetch?: boolean | string }) => {
            void _prefetch;
            return (
                <a href={href} {...props}>
                    {children}
                </a>
            );
        },
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
    estimated_value: null,
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
            wine,
        },
    ],
};

describe('cellar interactions', () => {
    it('shows loading feedback for visits that wait for the server', () => {
        render(<NavigationLoadingIndicator />);

        fireEvent(document, new CustomEvent('inertia:start', { detail: { visit: { prefetch: false, showProgress: true } } }));
        expect(screen.getByRole('status')).toHaveTextContent('Laddar…');

        fireEvent(document, new CustomEvent('inertia:finish', { detail: { visit: { prefetch: false, showProgress: true } } }));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('keeps the page available and shows a native error when a request loses its connection', () => {
        render(<NavigationLoadingIndicator />);
        const event = new CustomEvent('inertia:networkError', { cancelable: true, detail: { error: new Error('offline') } });
        fireEvent(document, event);
        expect(event.defaultPrevented).toBe(true);
        expect(screen.getByRole('dialog')).toHaveTextContent('Kontrollera din anslutning och försök igen.');
        fireEvent.click(screen.getByRole('button', { name: 'Fortsätt redigera', exact: true }));
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    it('offers login when an Inertia request reports an expired session', () => {
        render(<NavigationLoadingIndicator />);
        fireEvent(document, new CustomEvent('inertia:httpException', { cancelable: true, detail: { response: { status: 419 } } }));
        expect(screen.getByRole('dialog')).toHaveTextContent('Sessionen har gått ut.');
        expect(screen.getByRole('link', { name: 'Logga in' })).toHaveAttribute('href', '/login');
    });
    it('does not show loading feedback for background prefetches', () => {
        render(<NavigationLoadingIndicator />);

        fireEvent(document, new CustomEvent('inertia:start', { detail: { visit: { prefetch: true, showProgress: false } } }));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows the total collection value on the dashboard', () => {
        render(
            <Dashboard
                stats={{ bottles: 3, wines: 2, capacity: 10, occupied: 3, free: 7, unplaced: 0, total_value: 450.5 }}
                racks={[]}
                wines={[]}
                events={[]}
            />,
        );

        expect(screen.getByText('Samlingens värde')).toBeVisible();
        expect(screen.getByText(/450,50/)).toBeVisible();
    });

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
        expect(screen.getByText(/Producent · Ny producent/)).toBeVisible();
        expect(screen.getByRole('checkbox')).toBeChecked();
        expect(screen.getByRole('button', { name: /Godkänn valda uppgifter/ })).toBeEnabled();
        fireEvent.click(screen.getByRole('button', { name: /Externa betyg & källor/ }));
        expect(screen.getByRole('link', { name: /Vivino/ })).toHaveAttribute('rel', 'noopener noreferrer');
        expect(screen.getByRole('link', { name: /Producentens vinsida/ })).toHaveAttribute('target', '_blank');
    });
    it('keeps saving available and sends no enhancement request on image selection', () => {
        const mock = vi.spyOn(globalThis, 'fetch');
        render(<WineForm wine={null} racks={[]} />);
        fireEvent.change(screen.getByLabelText('Flaskbild'), { target: { files: [new File(['photo'], 'photo.jpg', { type: 'image/jpeg' })] } });
        expect(mock).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Läs etiketten' })).toBeEnabled();
        fireEvent.click(screen.getByRole('button', { name: 'Fyll i manuellt' }));
        fireEvent.change(screen.getByLabelText('Vinets namn *'), { target: { value: 'Mitt vin' } });
        fireEvent.change(screen.getByLabelText('Vintyp *'), { target: { value: 'red' } });
        fireEvent.click(screen.getByRole('button', { name: 'Fortsätt till antal & placering' }));
        expect(screen.getByLabelText('Inköpspris per flaska')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Spara vin och flaskor' })).toBeEnabled();
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
        expect(screen.getByRole('heading', { name: 'Markera konsumerad?' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Bekräfta' })).toBeVisible();
    });
    it('shows location before bottle actions and keeps moving separate from the current location', () => {
        render(<BottleDialog bottle={rack.bottles![0]} racks={[rack]} onClose={vi.fn()} />);
        expect(screen.getByRole('link', { name: 'Visa vinet' })).toHaveAttribute('href', '/wines/1');
        expect(screen.getByLabelText('Flaskans placering')).toBeVisible();
        expect(screen.queryByLabelText('Inköpspris')).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Flytta flaskan/ }));
        expect(screen.getByRole('button', { name: 'Spara placering' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'B2 Ledig' }));
        expect(screen.getByRole('button', { name: 'Spara placering' })).toBeEnabled();
        expect(screen.getByText('Vald plats: B2')).toBeVisible();
    });
    it('opens placement immediately for an unplaced bottle', () => {
        render(
            <BottleDialog
                bottle={{ ...rack.bottles![0], wine_rack_id: null, row: null, column: null, location: 'Oplacerad' }}
                racks={[rack]}
                onClose={vi.fn()}
            />,
        );
        expect(screen.getByRole('heading', { name: 'Placera flaskan' })).toBeVisible();
        expect(screen.getByLabelText('Välj hylla')).toHaveValue('1');
        expect(screen.getByRole('button', { name: 'Spara placering' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'B2 Ledig' }));
        expect(screen.getByRole('button', { name: 'Spara placering' })).toBeEnabled();
    });
    it('retains wine details when going back from placement', () => {
        render(<WineForm wine={null} racks={[rack]} />);
        fireEvent.click(screen.getByRole('button', { name: 'Fyll i manuellt' }));
        fireEvent.change(screen.getByLabelText('Vinets namn *'), { target: { value: 'Mitt nya vin' } });
        fireEvent.change(screen.getByLabelText('Vintyp *'), { target: { value: 'white' } });
        fireEvent.click(screen.getByRole('button', { name: 'Fortsätt till antal & placering' }));
        fireEvent.change(screen.getByLabelText('Antal flaskor'), { target: { value: '2' } });
        fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till vinuppgifter' }));
        expect(screen.getByLabelText('Vinets namn *')).toHaveValue('Mitt nya vin');
        expect(screen.getByLabelText('Vintyp *')).toHaveValue('white');
    });
    it('applies a purchase price to all available bottles when selected', async () => {
        const fetchMock = vi
            .spyOn(globalThis, 'fetch')
            .mockResolvedValue({ ok: true, json: async () => ({ purchase_price: 299, updated_count: 8 }) } as Response);
        render(<BottleFinancials bottle={rack.bottles![0]} />);
        fireEvent.change(screen.getByLabelText('Inköpspris'), { target: { value: '299' } });
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(screen.getByRole('button', { name: 'Spara inköpspris' }));
        await waitFor(() => expect(screen.getByText('Inköpspriset har sparats på 8 tillgängliga flaskor.')).toBeVisible());
        expect(fetchMock).toHaveBeenCalledWith('/bottles/1/financials', expect.objectContaining({ method: 'PATCH' }));
        expect(fetchMock).toHaveBeenCalledWith(
            '/bottles/1/financials',
            expect.objectContaining({ body: JSON.stringify({ purchase_price: 299, apply_to_available_wine_bottles: true }) }),
        );
        fetchMock.mockRestore();
    });
    it('shows a sourced valuation and total value on the wine', () => {
        render(
            <WineFinancials
                availableBottleCount={8}
                wine={{
                    ...wine,
                    estimated_value: 875,
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
        expect(screen.getByText(/7 000/)).toBeVisible();
        expect(screen.getByRole('link', { name: /Handlare/ })).toHaveAttribute('rel', 'noopener noreferrer');
    });
    it('explains an expired session on standalone requests', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ status: 419 } as Response);
        await expect(jsonRequest('/bottles/1/financials', {}, 'PATCH')).rejects.toThrow('Sessionen har gått ut.');
        fetchMock.mockRestore();
    });
    it('localizes network failures on standalone requests', async () => {
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
        await expect(jsonRequest('/wine-scans')).rejects.toThrow('Kunde inte ansluta.');
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
        fireEvent.click(screen.getByRole('button', { name: 'Fyll i manuellt' }));
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
