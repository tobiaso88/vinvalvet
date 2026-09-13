export type WineType = 'red' | 'white' | 'rose' | 'sparkling' | 'dessert' | 'fortified' | 'orange' | 'other';
export type WineBody = 'light' | 'medium' | 'full';
export type BottleStatus = 'available' | 'consumed' | 'removed';
export type EventType = 'created' | 'placed' | 'moved' | 'consumed' | 'removed';
export interface Wine {
    id: number;
    name: string;
    producer: string | null;
    vintage: number | null;
    type: WineType;
    country: string | null;
    region: string | null;
    alcohol: number | null;
    body: WineBody | null;
    notes: string | null;
    label_url: string | null;
    grapes: { id: number; name: string }[];
    bottles?: Bottle[];
    bottles_count?: number;
}
export interface Bottle {
    id: number;
    wine_id: number;
    wine_rack_id: number | null;
    row: number | null;
    column: number | null;
    status: BottleStatus;
    location: string;
    wine?: Wine;
}
export interface Rack {
    id: number;
    name: string;
    description: string | null;
    rows: number;
    columns: number;
    bottles?: Bottle[];
    bottles_count?: number;
}
export interface RackSlot {
    wine_rack_id: number;
    row: number;
    column: number;
}
export interface BottleEvent {
    id: number;
    type: EventType;
    from_location: string | null;
    to_location: string | null;
    created_at: string;
    bottle: Bottle;
}
export interface WineScanResult {
    fields: {
        name: string | null;
        producer: string | null;
        vintage: number | null;
        type: WineType | null;
        country: string | null;
        region: string | null;
        alcohol: number | null;
        body: WineBody | null;
        grapes: string[];
    };
    confidence: Record<string, 'high' | 'medium' | 'low' | 'unknown'>;
    warnings: string[];
}
export interface PairingRecommendation {
    wine: Wine;
    reason: string;
    rank: number;
}
export interface PairingResult {
    recommendations: PairingRecommendation[];
    message: string;
}
export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
}
export const wineTypes: Record<WineType, string> = {
    red: 'Rött',
    white: 'Vitt',
    rose: 'Rosé',
    sparkling: 'Mousserande',
    dessert: 'Dessertvin',
    fortified: 'Starkvin',
    orange: 'Orange',
    other: 'Övrigt',
};
export const wineBodies: Record<WineBody, string> = { light: 'Lätt', medium: 'Medelfylligt', full: 'Fylligt' };
export const eventTypes: Record<EventType, string> = {
    created: 'Tillagd',
    placed: 'Placerad',
    moved: 'Flyttad',
    consumed: 'Konsumerad',
    removed: 'Borttagen',
};
export const typeColors: Record<WineType, string> = {
    red: '#8e394a',
    white: '#c1a451',
    rose: '#cc8a8f',
    sparkling: '#8b9c79',
    dessert: '#be8e40',
    fortified: '#776073',
    orange: '#c77e47',
    other: '#8a8a83',
};
