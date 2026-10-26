package com.autotech.email.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HtmlToTextTest {

    @Test
    void givenHtmlWithLinkAndBlocks_whenConvert_thenReturnReadableTextWithUrl() {
        // Arrange
        String html = """
                <html><head><title>x</title><style>p{color:red}</style></head>
                <body><h1>Hola</h1><p>Tu turno es el <b>jueves</b>.</p>
                <a href="https://app.test/turno/abc">Confirmar turno</a><br>Gracias&nbsp;&amp; saludos</body></html>
                """;

        // Act
        String text = HtmlToText.convert(html);

        // Assert
        assertThat(text).contains("Hola");
        assertThat(text).contains("Tu turno es el jueves.");
        assertThat(text).contains("Confirmar turno: https://app.test/turno/abc");
        assertThat(text).contains("Gracias & saludos");
        assertThat(text).doesNotContain("<").doesNotContain("color:red");
    }

    @Test
    void givenTableRows_whenConvert_thenEachRowOnItsOwnLine() {
        // Arrange
        String html = "<table><tr><td>Fecha</td><td>23/10</td></tr><tr><td>Total</td><td>$ 10,00</td></tr></table>";

        // Act
        String text = HtmlToText.convert(html);

        // Assert
        assertThat(text).isEqualTo("Fecha 23/10\nTotal $ 10,00");
    }

    @Test
    void givenNull_whenConvert_thenReturnEmpty() {
        assertThat(HtmlToText.convert(null)).isEmpty();
    }
}
