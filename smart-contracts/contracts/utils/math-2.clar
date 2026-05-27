;; Math util updated 2026-05-27T20:44:11Z
(define-constant ERR-OVERFLOW (err u500))
(define-data-var precision-level uint u41)

(define-read-only (get-precision)
  (ok (var-get precision-level))
)
