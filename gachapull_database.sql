--
-- PostgreSQL database dump
--

\restrict P60Fk4K7OOWrG4ywGhGvipAHUD2bTduN8dSYYS2wsDWvSTs44XCKgmFHeC1kP1q

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: coin_transaction_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.coin_transaction_type AS ENUM (
    'credit',
    'debit'
);


ALTER TYPE public.coin_transaction_type OWNER TO postgres;

--
-- Name: franchise; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.franchise AS ENUM (
    'pokemon',
    'onepiece'
);


ALTER TYPE public.franchise OWNER TO postgres;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'stripe',
    'midtrans',
    'usdt'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- Name: rarity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.rarity AS ENUM (
    'common',
    'rare',
    'super_rare',
    'ultra_rare',
    'legendary'
);


ALTER TYPE public.rarity OWNER TO postgres;

--
-- Name: role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.role AS ENUM (
    'user',
    'admin'
);


ALTER TYPE public.role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cards (
    id integer NOT NULL,
    name text NOT NULL,
    franchise public.franchise NOT NULL,
    rarity public.rarity NOT NULL,
    image_url text NOT NULL,
    description text,
    pull_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.cards OWNER TO postgres;

--
-- Name: cards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cards_id_seq OWNER TO postgres;

--
-- Name: cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cards_id_seq OWNED BY public.cards.id;


--
-- Name: coin_packages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coin_packages (
    id integer NOT NULL,
    name text NOT NULL,
    coins integer NOT NULL,
    price_usd numeric(10,2) NOT NULL,
    bonus_coins integer DEFAULT 0,
    is_popular boolean DEFAULT false,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.coin_packages OWNER TO postgres;

--
-- Name: coin_packages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coin_packages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coin_packages_id_seq OWNER TO postgres;

--
-- Name: coin_packages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coin_packages_id_seq OWNED BY public.coin_packages.id;


--
-- Name: coin_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coin_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    amount integer NOT NULL,
    type public.coin_transaction_type NOT NULL,
    description text NOT NULL,
    reference_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.coin_transactions OWNER TO postgres;

--
-- Name: coin_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coin_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coin_transactions_id_seq OWNER TO postgres;

--
-- Name: coin_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coin_transactions_id_seq OWNED BY public.coin_transactions.id;


--
-- Name: gacha_pulls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.gacha_pulls (
    id integer NOT NULL,
    user_id integer NOT NULL,
    pack_id integer NOT NULL,
    card_id integer NOT NULL,
    pulled_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.gacha_pulls OWNER TO postgres;

--
-- Name: gacha_pulls_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.gacha_pulls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gacha_pulls_id_seq OWNER TO postgres;

--
-- Name: gacha_pulls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.gacha_pulls_id_seq OWNED BY public.gacha_pulls.id;


--
-- Name: pack_cards; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pack_cards (
    id integer NOT NULL,
    pack_id integer NOT NULL,
    card_id integer NOT NULL,
    probability numeric(10,6) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pack_cards OWNER TO postgres;

--
-- Name: pack_cards_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pack_cards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pack_cards_id_seq OWNER TO postgres;

--
-- Name: pack_cards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pack_cards_id_seq OWNED BY public.pack_cards.id;


--
-- Name: packs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.packs (
    id integer NOT NULL,
    name text NOT NULL,
    franchise public.franchise NOT NULL,
    price_coins integer NOT NULL,
    price_usd numeric(10,2),
    image_url text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.packs OWNER TO postgres;

--
-- Name: packs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.packs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.packs_id_seq OWNER TO postgres;

--
-- Name: packs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.packs_id_seq OWNED BY public.packs.id;


--
-- Name: payment_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_orders (
    id integer NOT NULL,
    user_id integer NOT NULL,
    coin_package_id integer,
    amount_usd numeric(10,2) NOT NULL,
    coins_granted integer NOT NULL,
    method public.payment_method NOT NULL,
    status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    payment_ref text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_orders OWNER TO postgres;

--
-- Name: payment_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_orders_id_seq OWNER TO postgres;

--
-- Name: payment_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_orders_id_seq OWNED BY public.payment_orders.id;


--
-- Name: payment_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payment_settings OWNER TO postgres;

--
-- Name: payment_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_settings_id_seq OWNER TO postgres;

--
-- Name: payment_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_settings_id_seq OWNED BY public.payment_settings.id;


--
-- Name: user_coins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_coins (
    user_id integer NOT NULL,
    balance integer DEFAULT 0 NOT NULL,
    total_earned integer DEFAULT 0 NOT NULL,
    total_spent integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_coins OWNER TO postgres;

--
-- Name: user_collection; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_collection (
    id integer NOT NULL,
    user_id integer NOT NULL,
    card_id integer NOT NULL,
    count integer DEFAULT 1 NOT NULL,
    first_obtained_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_collection OWNER TO postgres;

--
-- Name: user_collection_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_collection_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_collection_id_seq OWNER TO postgres;

--
-- Name: user_collection_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_collection_id_seq OWNED BY public.user_collection.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role public.role DEFAULT 'user'::public.role NOT NULL,
    avatar_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: cards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cards ALTER COLUMN id SET DEFAULT nextval('public.cards_id_seq'::regclass);


--
-- Name: coin_packages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coin_packages ALTER COLUMN id SET DEFAULT nextval('public.coin_packages_id_seq'::regclass);


--
-- Name: coin_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coin_transactions ALTER COLUMN id SET DEFAULT nextval('public.coin_transactions_id_seq'::regclass);


--
-- Name: gacha_pulls id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gacha_pulls ALTER COLUMN id SET DEFAULT nextval('public.gacha_pulls_id_seq'::regclass);


--
-- Name: pack_cards id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pack_cards ALTER COLUMN id SET DEFAULT nextval('public.pack_cards_id_seq'::regclass);


--
-- Name: packs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packs ALTER COLUMN id SET DEFAULT nextval('public.packs_id_seq'::regclass);


--
-- Name: payment_orders id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_orders ALTER COLUMN id SET DEFAULT nextval('public.payment_orders_id_seq'::regclass);


--
-- Name: payment_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_settings ALTER COLUMN id SET DEFAULT nextval('public.payment_settings_id_seq'::regclass);


--
-- Name: user_collection id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_collection ALTER COLUMN id SET DEFAULT nextval('public.user_collection_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: cards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cards (id, name, franchise, rarity, image_url, description, pull_count, created_at, updated_at) FROM stdin;
1	Charizard	pokemon	legendary	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png	The ultimate fire dragon Pokemon	0	2026-04-30 17:04:15.794987	2026-04-30 17:04:15.794987
2	Pikachu	pokemon	rare	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png	The iconic electric mouse Pokemon	0	2026-04-30 17:04:20.381388	2026-04-30 17:04:20.381388
3	Mewtwo	pokemon	legendary	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png	The genetic Pokemon, created by science	0	2026-04-30 17:04:24.96082	2026-04-30 17:04:24.96082
6	Dragonite	pokemon	ultra_rare	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png	The dragon Pokemon soaring the skies	0	2026-04-30 17:04:40.596209	2026-04-30 17:04:40.596209
7	Blastoise	pokemon	super_rare	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png	The shellfish Pokemon with water cannons	0	2026-04-30 17:04:45.094114	2026-04-30 17:04:45.094114
8	Venusaur	pokemon	super_rare	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png	The seed Pokemon in full bloom	0	2026-04-30 17:04:49.572726	2026-04-30 17:04:49.572726
9	Snorlax	pokemon	rare	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png	The sleeping Pokemon blocking roads	0	2026-04-30 17:04:53.856276	2026-04-30 17:04:53.856276
10	Bulbasaur	pokemon	common	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png	The seed Pokemon starter	0	2026-04-30 17:04:58.53629	2026-04-30 17:04:58.53629
11	Charmander	pokemon	common	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png	The lizard Pokemon with a burning tail	0	2026-04-30 17:05:03.493343	2026-04-30 17:05:03.493343
12	Squirtle	pokemon	common	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png	The tiny turtle Pokemon	0	2026-04-30 17:05:09.231956	2026-04-30 17:05:09.231956
13	Mew	pokemon	legendary	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png	The mythical Pokemon ancestor	0	2026-04-30 17:05:13.803302	2026-04-30 17:05:13.803302
14	Lucario	pokemon	ultra_rare	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png	The aura Pokemon fighting champion	0	2026-04-30 17:05:18.737206	2026-04-30 17:05:18.737206
15	Garchomp	pokemon	ultra_rare	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png	The mach Pokemon speed demon	0	2026-04-30 17:05:23.060058	2026-04-30 17:05:23.060058
16	Monkey D. Luffy	onepiece	legendary	https://upload.wikimedia.org/wikipedia/en/9/90/Monkey_D_Luffy.png	The future King of Pirates, Gear 5 awakened	0	2026-04-30 17:05:27.67822	2026-04-30 17:05:27.67822
17	Roronoa Zoro	onepiece	ultra_rare	https://upload.wikimedia.org/wikipedia/en/1/15/Roronoa_Zoro.png	The world's greatest swordsman in training	0	2026-04-30 17:05:32.426354	2026-04-30 17:05:32.426354
18	Trafalgar Law	onepiece	super_rare	https://i.imgur.com/placeholder-law.jpg	The Surgeon of Death with Ope-Ope no Mi	0	2026-04-30 17:05:38.191	2026-04-30 17:05:38.191
19	Portgas D. Ace	onepiece	legendary	https://i.imgur.com/placeholder-ace.jpg	The Fire Fist Ace, son of the Pirate King	0	2026-04-30 17:05:44.295967	2026-04-30 17:05:44.295967
20	Boa Hancock	onepiece	ultra_rare	https://i.imgur.com/placeholder-hancock.jpg	The Snake Princess and Pirate Empress	0	2026-04-30 17:05:48.973915	2026-04-30 17:05:48.973915
21	Nami	onepiece	rare	https://i.imgur.com/placeholder-nami.jpg	The Cat Burglar navigator of the Straw Hats	0	2026-04-30 17:05:53.476836	2026-04-30 17:05:53.476836
22	Sanji	onepiece	super_rare	https://i.imgur.com/placeholder-sanji.jpg	The Black Leg vinsmoke, Straw Hat cook	0	2026-04-30 17:05:58.260528	2026-04-30 17:05:58.260528
23	Tony Tony Chopper	onepiece	common	https://i.imgur.com/placeholder-chopper.jpg	The reindeer doctor of the Straw Hats	0	2026-04-30 17:06:02.933451	2026-04-30 17:06:02.933451
24	Nico Robin	onepiece	rare	https://i.imgur.com/placeholder-robin.jpg	The Devil Child archaeologist	0	2026-04-30 17:06:07.546278	2026-04-30 17:06:07.546278
25	Usopp	onepiece	common	https://i.imgur.com/placeholder-usopp.jpg	The brave warrior of the sea	0	2026-04-30 17:06:12.043157	2026-04-30 17:06:12.043157
26	Brook	onepiece	common	https://i.imgur.com/placeholder-brook.jpg	The Soul King musician skeleton	0	2026-04-30 17:06:16.457684	2026-04-30 17:06:16.457684
27	Shanks	onepiece	legendary	https://i.imgur.com/placeholder-shanks.jpg	Red Hair Shanks, one of the Four Emperors	0	2026-04-30 17:06:20.972833	2026-04-30 17:06:20.972833
28	Whitebeard	onepiece	legendary	https://i.imgur.com/placeholder-wb.jpg	The Strongest Man in the World	0	2026-04-30 17:06:25.401434	2026-04-30 17:06:25.401434
29	Kaido	onepiece	ultra_rare	https://i.imgur.com/placeholder-kaido.jpg	The Strongest Creature in the World	0	2026-04-30 17:06:29.946083	2026-04-30 17:06:29.946083
30	Jinbe	onepiece	super_rare	https://i.imgur.com/placeholder-jinbe.jpg	The Knight of the Sea fishman warrior	0	2026-04-30 17:06:34.307612	2026-04-30 17:06:34.307612
5	Eevee	pokemon	common	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png	The evolution Pokemon with limitless potential	1	2026-04-30 17:04:34.009898	2026-04-30 17:04:34.009898
4	Gengar	pokemon	super_rare	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png	The shadow Pokemon lurking in darkness	1	2026-04-30 17:04:29.480986	2026-04-30 17:04:29.480986
\.


--
-- Data for Name: coin_packages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coin_packages (id, name, coins, price_usd, bonus_coins, is_popular, is_active, created_at, updated_at) FROM stdin;
1	Starter Pack	100	0.99	0	f	t	2026-04-30 17:13:06.665188	2026-04-30 17:13:06.665188
2	Basic Pack	500	4.99	50	f	t	2026-04-30 17:13:10.828397	2026-04-30 17:13:10.828397
3	Value Pack	1200	9.99	200	t	t	2026-04-30 17:13:15.35476	2026-04-30 17:13:15.35476
4	Pro Pack	3000	24.99	600	f	t	2026-04-30 17:13:20.525023	2026-04-30 17:13:20.525023
5	Elite Pack	6500	49.99	1500	f	t	2026-04-30 17:13:25.071731	2026-04-30 17:13:25.071731
6	Legendary Pack	15000	99.99	5000	f	t	2026-04-30 17:13:32.635747	2026-04-30 17:13:32.635747
\.


--
-- Data for Name: coin_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coin_transactions (id, user_id, amount, type, description, reference_id, created_at) FROM stdin;
1	1	-100	debit	Pulled 1x from Pokemon Base Set	\N	2026-04-30 17:34:02.334681
2	1	-100	debit	Pulled 1x from Pokemon Base Set	\N	2026-04-30 17:38:07.166897
\.


--
-- Data for Name: gacha_pulls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.gacha_pulls (id, user_id, pack_id, card_id, pulled_at) FROM stdin;
1	1	1	5	2026-04-30 17:34:02.324645
2	1	1	4	2026-04-30 17:38:07.152626
\.


--
-- Data for Name: pack_cards; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pack_cards (id, pack_id, card_id, probability, created_at) FROM stdin;
1	1	1	0.006667	2026-04-30 17:07:36.215596
2	2	1	0.033333	2026-04-30 17:07:41.281452
3	1	2	0.100000	2026-04-30 17:07:46.228914
4	2	2	0.125000	2026-04-30 17:07:52.120667
5	1	3	0.006667	2026-04-30 17:07:56.60432
6	2	3	0.033333	2026-04-30 17:08:01.122594
7	1	4	0.043333	2026-04-30 17:08:05.662317
8	2	4	0.066667	2026-04-30 17:08:10.052583
9	1	5	0.100000	2026-04-30 17:08:14.574628
10	2	5	0.025000	2026-04-30 17:08:19.059265
11	1	6	0.016667	2026-04-30 17:08:23.480352
12	2	6	0.050000	2026-04-30 17:08:28.262291
13	1	7	0.043333	2026-04-30 17:08:32.796287
14	2	7	0.066667	2026-04-30 17:08:37.40827
15	1	8	0.043333	2026-04-30 17:08:41.915198
16	2	8	0.066667	2026-04-30 17:08:48.094518
17	1	9	0.100000	2026-04-30 17:08:52.620995
18	2	9	0.125000	2026-04-30 17:08:57.072024
19	1	10	0.100000	2026-04-30 17:09:03.15461
20	2	10	0.025000	2026-04-30 17:09:09.817514
21	1	11	0.100000	2026-04-30 17:09:14.310141
22	2	11	0.025000	2026-04-30 17:09:18.683987
23	1	12	0.100000	2026-04-30 17:09:23.111996
24	2	12	0.025000	2026-04-30 17:09:27.795706
25	1	13	0.006667	2026-04-30 17:09:32.517786
26	2	13	0.033333	2026-04-30 17:09:36.921518
27	1	14	0.016667	2026-04-30 17:09:42.708775
28	2	14	0.050000	2026-04-30 17:09:47.58752
29	1	15	0.016667	2026-04-30 17:09:52.115476
30	2	15	0.050000	2026-04-30 17:09:56.618747
31	3	16	0.005000	2026-04-30 17:10:26.627918
32	4	16	0.030000	2026-04-30 17:10:31.626781
33	3	17	0.016667	2026-04-30 17:10:36.512884
34	4	17	0.060000	2026-04-30 17:10:41.318272
35	3	18	0.043333	2026-04-30 17:10:45.865259
36	4	18	0.066667	2026-04-30 17:11:05.264092
37	3	19	0.005000	2026-04-30 17:11:09.718411
38	4	19	0.030000	2026-04-30 17:11:14.136688
39	3	20	0.016667	2026-04-30 17:11:18.610526
40	4	20	0.060000	2026-04-30 17:11:22.984024
41	3	21	0.100000	2026-04-30 17:11:27.398364
42	4	21	0.125000	2026-04-30 17:11:31.935325
43	3	22	0.043333	2026-04-30 17:11:36.517765
44	4	22	0.066667	2026-04-30 17:11:45.76943
45	3	23	0.133333	2026-04-30 17:11:50.793785
46	4	23	0.033333	2026-04-30 17:11:55.47244
47	3	24	0.100000	2026-04-30 17:11:59.970412
48	4	24	0.125000	2026-04-30 17:12:04.353119
49	3	25	0.133333	2026-04-30 17:12:10.704228
50	4	25	0.033333	2026-04-30 17:12:15.141461
51	3	26	0.133333	2026-04-30 17:12:21.384315
52	4	26	0.033333	2026-04-30 17:12:25.732497
53	3	27	0.005000	2026-04-30 17:12:30.254011
54	4	27	0.030000	2026-04-30 17:12:34.825388
55	3	28	0.005000	2026-04-30 17:12:39.727682
56	4	28	0.030000	2026-04-30 17:12:44.131925
57	3	29	0.016667	2026-04-30 17:12:48.661303
58	4	29	0.060000	2026-04-30 17:12:53.045996
59	3	30	0.043333	2026-04-30 17:12:57.664971
60	4	30	0.066667	2026-04-30 17:13:02.136858
\.


--
-- Data for Name: packs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.packs (id, name, franchise, price_coins, price_usd, image_url, description, is_active, created_at, updated_at) FROM stdin;
1	Pokemon Base Set	pokemon	100	4.99	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png	Classic Pokemon Base Set pack. Pull common to rare cards!	t	2026-04-30 17:06:54.379767	2026-04-30 17:06:54.379767
2	Pokemon Legendary Pack	pokemon	500	19.99	https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png	Premium pack with boosted legendary rates!	t	2026-04-30 17:06:58.916749	2026-04-30 17:06:58.916749
3	One Piece Grand Line	onepiece	150	5.99	https://upload.wikimedia.org/wikipedia/en/9/90/Monkey_D_Luffy.png	Sail the Grand Line and collect Straw Hat crew cards!	t	2026-04-30 17:07:03.260627	2026-04-30 17:07:03.260627
4	One Piece Emperor Pack	onepiece	750	24.99	https://upload.wikimedia.org/wikipedia/en/1/15/Roronoa_Zoro.png	Chase the Four Emperors with ultra rare rates!	t	2026-04-30 17:07:07.850154	2026-04-30 17:07:07.850154
\.


--
-- Data for Name: payment_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_orders (id, user_id, coin_package_id, amount_usd, coins_granted, method, status, payment_ref, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_settings (id, key, value, updated_at) FROM stdin;
\.


--
-- Data for Name: user_coins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_coins (user_id, balance, total_earned, total_spent, updated_at) FROM stdin;
1	9799	9999	200	2026-04-30 17:38:07.161
\.


--
-- Data for Name: user_collection; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_collection (id, user_id, card_id, count, first_obtained_at, updated_at) FROM stdin;
1	1	5	1	2026-04-30 17:34:02.319378	2026-04-30 17:34:02.319378
2	1	4	1	2026-04-30 17:38:07.119786	2026-04-30 17:38:07.119786
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, email, password_hash, role, avatar_url, created_at, updated_at) FROM stdin;
1	admin	admin@gachapull.com	$2b$12$DhSjfquJHSDgekX7U8xq1uMIBgQXU4yOES2xscnjs966NsO7SV07e	admin	\N	2026-04-30 17:13:37.048958	2026-04-30 17:13:37.048958
\.


--
-- Name: cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cards_id_seq', 30, true);


--
-- Name: coin_packages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coin_packages_id_seq', 6, true);


--
-- Name: coin_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coin_transactions_id_seq', 2, true);


--
-- Name: gacha_pulls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.gacha_pulls_id_seq', 2, true);


--
-- Name: pack_cards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pack_cards_id_seq', 60, true);


--
-- Name: packs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.packs_id_seq', 4, true);


--
-- Name: payment_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_orders_id_seq', 1, false);


--
-- Name: payment_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_settings_id_seq', 1, false);


--
-- Name: user_collection_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_collection_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- Name: cards cards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cards
    ADD CONSTRAINT cards_pkey PRIMARY KEY (id);


--
-- Name: coin_packages coin_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coin_packages
    ADD CONSTRAINT coin_packages_pkey PRIMARY KEY (id);


--
-- Name: coin_transactions coin_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coin_transactions
    ADD CONSTRAINT coin_transactions_pkey PRIMARY KEY (id);


--
-- Name: gacha_pulls gacha_pulls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gacha_pulls
    ADD CONSTRAINT gacha_pulls_pkey PRIMARY KEY (id);


--
-- Name: pack_cards pack_cards_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pack_cards
    ADD CONSTRAINT pack_cards_pkey PRIMARY KEY (id);


--
-- Name: packs packs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.packs
    ADD CONSTRAINT packs_pkey PRIMARY KEY (id);


--
-- Name: payment_orders payment_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_pkey PRIMARY KEY (id);


--
-- Name: payment_settings payment_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_settings
    ADD CONSTRAINT payment_settings_key_unique UNIQUE (key);


--
-- Name: payment_settings payment_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_settings
    ADD CONSTRAINT payment_settings_pkey PRIMARY KEY (id);


--
-- Name: user_coins user_coins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_coins
    ADD CONSTRAINT user_coins_pkey PRIMARY KEY (user_id);


--
-- Name: user_collection user_collection_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_collection
    ADD CONSTRAINT user_collection_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: coin_transactions coin_transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coin_transactions
    ADD CONSTRAINT coin_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: gacha_pulls gacha_pulls_card_id_cards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gacha_pulls
    ADD CONSTRAINT gacha_pulls_card_id_cards_id_fk FOREIGN KEY (card_id) REFERENCES public.cards(id);


--
-- Name: gacha_pulls gacha_pulls_pack_id_packs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gacha_pulls
    ADD CONSTRAINT gacha_pulls_pack_id_packs_id_fk FOREIGN KEY (pack_id) REFERENCES public.packs(id);


--
-- Name: gacha_pulls gacha_pulls_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.gacha_pulls
    ADD CONSTRAINT gacha_pulls_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: pack_cards pack_cards_card_id_cards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pack_cards
    ADD CONSTRAINT pack_cards_card_id_cards_id_fk FOREIGN KEY (card_id) REFERENCES public.cards(id) ON DELETE CASCADE;


--
-- Name: pack_cards pack_cards_pack_id_packs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pack_cards
    ADD CONSTRAINT pack_cards_pack_id_packs_id_fk FOREIGN KEY (pack_id) REFERENCES public.packs(id) ON DELETE CASCADE;


--
-- Name: payment_orders payment_orders_coin_package_id_coin_packages_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_coin_package_id_coin_packages_id_fk FOREIGN KEY (coin_package_id) REFERENCES public.coin_packages(id);


--
-- Name: payment_orders payment_orders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_orders
    ADD CONSTRAINT payment_orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_coins user_coins_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_coins
    ADD CONSTRAINT user_coins_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_collection user_collection_card_id_cards_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_collection
    ADD CONSTRAINT user_collection_card_id_cards_id_fk FOREIGN KEY (card_id) REFERENCES public.cards(id);


--
-- Name: user_collection user_collection_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_collection
    ADD CONSTRAINT user_collection_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict P60Fk4K7OOWrG4ywGhGvipAHUD2bTduN8dSYYS2wsDWvSTs44XCKgmFHeC1kP1q

