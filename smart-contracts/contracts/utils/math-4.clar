;; Math util updated 2026-05-27T20:06:42Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u39)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
