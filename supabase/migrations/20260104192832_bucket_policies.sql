-- Políticas para el bucket 'facturas'

-- Permitir a usuarios autenticados subir archivos
CREATE POLICY "Usuarios pueden subir facturas"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'facturas');

-- Permitir a usuarios autenticados ver sus archivos
CREATE POLICY "Usuarios pueden ver facturas"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'facturas');

-- Permitir a usuarios autenticados actualizar sus archivos
CREATE POLICY "Usuarios pueden actualizar facturas"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'facturas');

-- Permitir a usuarios autenticados eliminar sus archivos
CREATE POLICY "Usuarios pueden eliminar facturas"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'facturas');

-- Lo mismo para 'comprobantes'
CREATE POLICY "Usuarios pueden subir comprobantes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comprobantes');

CREATE POLICY "Usuarios pueden ver comprobantes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'comprobantes');

CREATE POLICY "Usuarios pueden actualizar comprobantes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'comprobantes');

CREATE POLICY "Usuarios pueden eliminar comprobantes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'comprobantes');
