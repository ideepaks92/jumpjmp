import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const workspaceId = formData.get("workspace_id") as string | null;
  const name = formData.get("name") as string | null;
  const fileType = formData.get("file_type") as string | null;
  const columnSchemaStr = formData.get("column_schema") as string | null;
  const dataStr = formData.get("data") as string | null;
  const rowCountStr = formData.get("row_count") as string | null;

  if (!file || !workspaceId || !name || !fileType || !columnSchemaStr || !dataStr) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify workspace ownership
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .eq("owner_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Upload raw file to storage
  const filePath = `${user.id}/${workspaceId}/${crypto.randomUUID()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("datasets")
    .upload(filePath, file);

  if (uploadError) {
    return NextResponse.json(
      { error: `File upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  let columnSchema, data;
  try {
    columnSchema = JSON.parse(columnSchemaStr);
    data = JSON.parse(dataStr);
  } catch {
    return NextResponse.json({ error: "Invalid JSON in column_schema or data" }, { status: 400 });
  }

  // Insert dataset record
  const { data: dataset, error: insertError } = await supabase
    .from("datasets")
    .insert({
      workspace_id: workspaceId,
      name,
      file_path: filePath,
      file_type: fileType,
      row_count: rowCountStr ? parseInt(rowCountStr, 10) : data.length,
      column_schema: columnSchema,
      data,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(dataset, { status: 201 });
}
