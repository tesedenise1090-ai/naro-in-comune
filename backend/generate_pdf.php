<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/pdf");
header("Access-Control-Allow-Methods: POST, GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require('fpdf/fpdf.php');

// Ricezione dati JSON o GET
$data = json_decode(file_get_contents("php://input"));
if (!$data && isset($_GET['data'])) {
    $data = json_decode($_GET['data']);
}

if(
    !empty($data->nome) &&
    !empty($data->cognome) &&
    !empty($data->cf) &&
    !empty($data->petizione_titolo)
) {
    // Sanitizzazione base (anche se non salviamo nel DB, preveniamo XSS nel PDF se necessario)
    $nome = htmlspecialchars(strip_tags($data->nome));
    $cognome = htmlspecialchars(strip_tags($data->cognome));
    $cf = htmlspecialchars(strip_tags($data->cf));
    $petizione_titolo = htmlspecialchars(strip_tags($data->petizione_titolo));
    $data_odierna = date('d/m/Y');

    $pdf = new FPDF();
    $pdf->AddPage();
    $pdf->SetFont('Arial', 'B', 16);
    
    // Titolo
    $pdf->Cell(0, 10, 'Sottoscrizione Istanza Civica', 0, 1, 'C');
    $pdf->Ln(10);
    
    $pdf->SetFont('Arial', '', 12);
    $pdf->MultiCell(0, 10, "Il/La sottoscritto/a $nome $cognome, Codice Fiscale $cf, con la presente dichiara di voler sottoscrivere formalmente l'istanza civica denominata:");
    $pdf->Ln(5);
    
    $pdf->SetFont('Arial', 'B', 12);
    $pdf->MultiCell(0, 10, "\"$petizione_titolo\"");
    $pdf->Ln(5);
    
    $pdf->SetFont('Arial', '', 12);
    $pdf->MultiCell(0, 10, "La presente sottoscrizione viene generata per l'invio telematico tramite PEC all'ente di competenza. I dati personali qui inseriti non sono stati memorizzati nei sistemi della piattaforma, in ottemperanza alle normative GDPR (Zero-Storage).");
    
    $pdf->Ln(20);
    $pdf->Cell(0, 10, "Data: $data_odierna", 0, 1, 'L');
    $pdf->Ln(10);
    $pdf->Cell(0, 10, "Firma: _______________________", 0, 1, 'R');
    
    // Output PDF
    $pdf->Output('D', 'Istanza_Civica_' . $cf . '.pdf');
} else {
    http_response_code(400);
    echo json_encode(["message" => "Dati incompleti. Impossibile generare il PDF."]);
}
?>
