package com.autotech.email.service;

import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Minimal HTML-to-plain-text conversion used as the text/plain alternative of every email.
 * Links are kept as "label: url" so they remain usable in text-only clients.
 */
public final class HtmlToText {

    private static final Pattern HEAD = Pattern.compile("(?is)<(head|style|script)[^>]*>.*?</\\1>");
    private static final Pattern ANCHOR = Pattern.compile("(?is)<a\\s[^>]*href=\"([^\"]*)\"[^>]*>(.*?)</a>");
    private static final Pattern LINE_BREAK = Pattern.compile("(?i)<br\\s*/?>");
    private static final Pattern BLOCK_END = Pattern.compile("(?i)</(p|div|tr|h[1-6]|li|table)>");
    private static final Pattern CELL_END = Pattern.compile("(?i)</td>");
    private static final Pattern TAG = Pattern.compile("(?s)<[^>]+>");
    private static final Pattern NUMERIC_ENTITY = Pattern.compile("&#(\\d+);");

    private HtmlToText() {
    }

    public static String convert(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }
        String text = HEAD.matcher(html).replaceAll("");
        // Whitespace in HTML source is not significant; line breaks come only from markup below
        text = text.replaceAll("\\s+", " ");
        text = replaceAnchors(text);
        text = LINE_BREAK.matcher(text).replaceAll("\n");
        text = BLOCK_END.matcher(text).replaceAll("\n");
        text = CELL_END.matcher(text).replaceAll(" ");
        text = TAG.matcher(text).replaceAll("");
        text = unescape(text).replace("\u200B", "");

        String normalized = Arrays.stream(text.split("\n"))
                .map(line -> line.replaceAll("[ \\t\\u00A0]+", " ").trim())
                .collect(Collectors.joining("\n"));
        return normalized.replaceAll("\n{3,}", "\n\n").trim();
    }

    private static String replaceAnchors(String html) {
        Matcher matcher = ANCHOR.matcher(html);
        StringBuilder result = new StringBuilder();
        while (matcher.find()) {
            String href = matcher.group(1).trim();
            String label = TAG.matcher(matcher.group(2)).replaceAll("").trim();
            String replacement;
            if (href.startsWith("http") && !href.equals(unescape(label))) {
                replacement = label.isEmpty() ? href : label + ": " + href;
            } else {
                replacement = label;
            }
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);
        return result.toString();
    }

    private static String unescape(String text) {
        Matcher matcher = NUMERIC_ENTITY.matcher(text);
        StringBuilder result = new StringBuilder();
        while (matcher.find()) {
            int codePoint = Integer.parseInt(matcher.group(1));
            matcher.appendReplacement(result, Matcher.quoteReplacement(new String(Character.toChars(codePoint))));
        }
        matcher.appendTail(result);
        return result.toString()
                .replace("&nbsp;", " ")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&amp;", "&");
    }
}
