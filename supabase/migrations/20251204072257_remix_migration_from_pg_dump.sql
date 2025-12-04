CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'usuario'
);


--
-- Name: liturgical_season; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.liturgical_season AS ENUM (
    'adviento',
    'navidad',
    'cuaresma',
    'pascua',
    'tiempo_ordinario'
);


--
-- Name: song_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.song_type AS ENUM (
    'entrada',
    'senor_ten_piedad',
    'gloria',
    'aleluya',
    'padre_nuestro',
    'ofertorio',
    'santo',
    'cordero',
    'salida',
    'extra'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'nombre', 'Usuario'), new.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'usuario');
  
  RETURN new;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: cantos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cantos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre text NOT NULL,
    foto_url text,
    audio_url text,
    tipo public.song_type NOT NULL,
    tiempos_liturgicos public.liturgical_season[] DEFAULT '{}'::public.liturgical_season[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: misa_cantos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.misa_cantos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    misa_id uuid NOT NULL,
    canto_id uuid NOT NULL,
    tipo public.song_type NOT NULL,
    orden integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: misas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.misas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    fecha date NOT NULL,
    descripcion text,
    usuario_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    nombre text NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'usuario'::public.app_role NOT NULL
);


--
-- Name: cantos cantos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cantos
    ADD CONSTRAINT cantos_pkey PRIMARY KEY (id);


--
-- Name: misa_cantos misa_cantos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.misa_cantos
    ADD CONSTRAINT misa_cantos_pkey PRIMARY KEY (id);


--
-- Name: misas misas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.misas
    ADD CONSTRAINT misas_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: cantos update_cantos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cantos_updated_at BEFORE UPDATE ON public.cantos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: misas update_misas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_misas_updated_at BEFORE UPDATE ON public.misas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: misa_cantos misa_cantos_canto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.misa_cantos
    ADD CONSTRAINT misa_cantos_canto_id_fkey FOREIGN KEY (canto_id) REFERENCES public.cantos(id) ON DELETE CASCADE;


--
-- Name: misa_cantos misa_cantos_misa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.misa_cantos
    ADD CONSTRAINT misa_cantos_misa_id_fkey FOREIGN KEY (misa_id) REFERENCES public.misas(id) ON DELETE CASCADE;


--
-- Name: misas misas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.misas
    ADD CONSTRAINT misas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: cantos Admins can delete songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete songs" ON public.cantos FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can insert roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can view all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: misas Authenticated users can create masses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create masses" ON public.misas FOR INSERT TO authenticated WITH CHECK ((auth.uid() = usuario_id));


--
-- Name: misa_cantos Authenticated users can insert mass songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert mass songs" ON public.misa_cantos FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.misas
  WHERE ((misas.id = misa_cantos.misa_id) AND (misas.usuario_id = auth.uid())))));


--
-- Name: cantos Authenticated users can insert songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert songs" ON public.cantos FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: cantos Authenticated users can update songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update songs" ON public.cantos FOR UPDATE TO authenticated USING (true);


--
-- Name: misa_cantos Authenticated users can view mass songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view mass songs" ON public.misa_cantos FOR SELECT TO authenticated USING (true);


--
-- Name: misas Authenticated users can view masses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view masses" ON public.misas FOR SELECT TO authenticated USING (true);


--
-- Name: cantos Authenticated users can view songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view songs" ON public.cantos FOR SELECT TO authenticated USING (true);


--
-- Name: misa_cantos Users can delete their own mass songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own mass songs" ON public.misa_cantos FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.misas
  WHERE ((misas.id = misa_cantos.misa_id) AND (misas.usuario_id = auth.uid())))));


--
-- Name: misas Users can delete their own masses or admins can delete any; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own masses or admins can delete any" ON public.misas FOR DELETE USING (((auth.uid() = usuario_id) OR public.has_role(auth.uid(), 'admin'::public.app_role)));


--
-- Name: misa_cantos Users can update their own mass songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own mass songs" ON public.misa_cantos FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.misas
  WHERE ((misas.id = misa_cantos.misa_id) AND (misas.usuario_id = auth.uid())))));


--
-- Name: misas Users can update their own masses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own masses" ON public.misas FOR UPDATE USING ((auth.uid() = usuario_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: cantos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cantos ENABLE ROW LEVEL SECURITY;

--
-- Name: misa_cantos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.misa_cantos ENABLE ROW LEVEL SECURITY;

--
-- Name: misas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.misas ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


